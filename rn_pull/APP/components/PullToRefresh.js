import React, { Component } from 'react'
import { View, Animated, PanResponder } from 'react-native'

export default class PullToRefresh extends Component {

  constructor(props) {
    super(props)

    this.containerTranslateY = 0  // 当前容器移动的距离
    this.innerScrollTop = 0  // 内部scroll容器顶部滚动的距离
    this.headerRef = null
    this.scrollRef = null
    this.updateInnerScrollRef = ref => this.scrollRef = ref
    
    // 下拉容器的过程中，动态传递下拉的距离给 header 组件，直接调用方法，不走本组件的 setState，避免卡顿
    this.containerTopChange = ({ value }) => {
      this.containerTranslateY = value
      if (this.headerRef) {
        this.headerRef.setProgress({
          pullDistance: value,
          percent: value / (this.props.refreshTriggerHeight || this.props.headerHeight),
        })
      }
    }
    
    this.innerScrollCallback = event => {
      this.innerScrollTop = event.nativeEvent.contentOffset.y
      this.checkScroll()
    }

    this.checkScroll = () => {
      if (this.innerScrollTop <= this.props.topPullThreshold) {
        if (this.state.scrollEnabled) {
          this.setState({
            scrollEnabled: false,
          })
        }
      } else {
        if (!this.state.scrollEnabled) {
          this.setState({
            scrollEnabled: true,
          })
        }
      }
    }

    this.state = {
      containerTop: new Animated.Value(0),  // 容器偏离顶部的距离
      scrollEnabled: false,  // 是否允许内部scrollview滚动
    }

    this.state.containerTop.addListener(this.containerTopChange)
    // this.onStartShouldSetResponder = this.onStartShouldSetResponder.bind(this)
    this.onMoveShouldSetResponder = this.onMoveShouldSetResponder.bind(this)
    this.onResponderGrant = this.onResponderGrant.bind(this)
    this.onResponderReject = this.onResponderReject.bind(this)
    this.onPanResponderMove = this.onPanResponderMove.bind(this)
    this.onPanResponderRelease = this.onPanResponderRelease.bind(this)
    this.onPanResponderTerminate = this.onPanResponderTerminate.bind(this)
    this.onResponderTerminationRequest = this.onResponderTerminationRequest.bind(this)

    this._panResponder = PanResponder.create({
      // onStartShouldSetPanResponder: this.onStartShouldSetResponder,
      onMoveShouldSetPanResponderCapture: this.onMoveShouldSetResponder,
      // onMoveShouldSetPanResponder: this.onMoveShouldSetResponder,
      onPanResponderGrant: this.onResponderGrant,
      onPanResponderReject: this.onResponderReject,
      onPanResponderMove: this.onPanResponderMove,
      onPanResponderRelease: this.onPanResponderRelease,
      onPanResponderTerminationRequest: this.onResponderTerminationRequest,
      onPanResponderTerminate: this.onPanResponderTerminate,
      onShouldBlockNativeResponder: (evt, gestureState) => {
        return true
      },
    })

  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevProps.refreshing && this.props.refreshing) {
      // 从 未加载 变化到 加载中
      const holdHeight = this.props.refreshingHoldHeight || this.props.headerHeight
      Animated.timing(this.state.containerTop, {
        toValue: holdHeight,
        duration: 150,
        useNativeDriver: true,
      }).start()
    } else if (prevProps.refreshing && !this.props.refreshing) {
      // 从 加载中 变化到 未加载
      Animated.timing(this.state.containerTop, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start()
    }
  }

  componentWillUnmount() {
    this.state.containerTop.removeAllListeners()
  }
  
  // updateInnerScrollState(enabled: boolean) {
  //     if (this.scrollRef) {
  //         console.log('====== innerScroll ', enabled);
  //         this.scrollRef.setNativeProps({
  //             scrollEnabled: enabled,
  //         });
  //     }
  // }
  // onStartShouldSetResponder(event, gestureState) {
  //     console.log('onStartShouldSetResponder', gestureState);
  //     return false;
  // }

  onMoveShouldSetResponder(event, gestureState) {
    if (this.props.refreshing) return false  // 正在刷新中，不接受再次下拉
    
    return !this.state.scrollEnabled
  }

  onResponderGrant(event, gestureState) {
    // console.log(`====== grant`)
  }

  onResponderReject(event, gestureState) {
    // console.log(`====== reject`)
  }

  onPanResponderMove(event, gestureState) {
    if (gestureState.dy >= 0) {
      // const dy = Math.max(0, gestureState.dy)
      this.state.containerTop.setValue(gestureState.dy)
    } else {
      this.state.containerTop.setValue(0)
      if (this.scrollRef) {
        if (typeof this.scrollRef.scrollToOffset === 'function') {
          // inner is FlatList
          this.scrollRef.scrollToOffset({
            offset: -gestureState.dy,
            animated: true,
          })
        } else if (typeof this.scrollRef.scrollTo === 'function') {
          // inner is ScrollView
          this.scrollRef.scrollTo({
            y: -gestureState.dy,
            animated: true,
          })
        }
      }
    }
  }

  onPanResponderRelease(event, gestureState) {
    // 判断是否达到了触发刷新的条件
    const threshold = this.props.refreshTriggerHeight || this.props.headerHeight

    if (this.containerTranslateY >= threshold) {
      this.props.onRefresh()  // 触发刷新
    } else {
      this.resetContainerPosition()  // 没到刷新的位置，回退到顶部
    }

    this.checkScroll()
  }

  onResponderTerminationRequest(event) {
    // console.log(`====== terminate request`)
    return false
  }

  onPanResponderTerminate(event, gestureState) {
    // console.log(`====== terminate`, this.innerScrollTop, gestureState.dy, gestureState.dy)
    this.resetContainerPosition()
    this.checkScroll()
  }

  resetContainerPosition() {
    Animated.timing(this.state.containerTop, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start()
  }

  renderHeader() {
    const style = {
      position: 'absolute',
      left: 0,
      width: '100%',
      top: -this.props.headerHeight,
      transform: [{ translateY: this.state.containerTop }],
    }
    const Header = this.props.HeaderComponent

    return (
      <Animated.View style={style}>
        <Header 
          ref={c => this.headerRef = c} 
          pullDistance={this.containerTranslateY} 
          percent={this.containerTranslateY / this.props.headerHeight} 
          refreshing={this.props.refreshing} 
        />
      </Animated.View>
    )
  }

  render() {
    const child = React.cloneElement(this.props.children, {
      onScroll: this.innerScrollCallback,
      bounces: false,
      alwaysBounceVertical: false,
      scrollEnabled: this.state.scrollEnabled,
      ref: this.updateInnerScrollRef,
    })

    return (
      <View style={this.props.style} {...this._panResponder.panHandlers}>
        <Animated.View style={[{ flex: 1, transform: [{ translateY: this.state.containerTop }] }]}>
          {child}
        </Animated.View>
        {this.renderHeader()}
      </View>
    )
  }
}

const styles = {
  con: {
    flex: 1,
    backgroundColor: '#fff',  // Android上，不设置这个背景色，貌似会触发  onPanResponderTerminate ！！！
  },
}

PullToRefresh.defaultProps = {
  style: styles.con,
  refreshing: false,
  topPullThreshold: 2,
}
