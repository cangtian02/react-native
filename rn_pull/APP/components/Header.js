import * as React from 'react';
import {
  Text,
  Animated,
  StyleSheet,
} from 'react-native';

const { Component } = React;

const styles = StyleSheet.create({
  con: {
    height: 100,
    justifyContent: 'center',
    backgroundColor: 'yellow',
  },
  title: {
    fontSize: 22,
  }
});

export default class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pullDistance: props.pullDistance,
      percent: props.percent,
    };
  }

  setProgress({ pullDistance, percent }) {
    this.setState({
      pullDistance,
      percent,
    });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      pullDistance: nextProps.pullDistance,
      percent: nextProps.percent,
    });
  }

  render() {
    const { refreshing } = this.props;
    const { percent, pullDistance } = this.state;

    let text = 'pull to refresh ';
    if (percent >= 1) {
      if (refreshing) {
        text = 'refreshing...';
      } else {
        text = 'release to refresh  ';
      }
    }
    text += pullDistance.toFixed(2);
    return (
      <Animated.View style={styles.con}>
        <Text style={styles.title}>{text}</Text>
      </Animated.View>
    );
  }
}
