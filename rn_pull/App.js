import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
} from 'react-native';
import PullToRefresh from './js/PullToRefresh.js';
import Header from './js/Header.js';

export default class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      refreshing: false,
    };
  }

  onRefresh() {
    this.setState({
      refreshing: true,
    }, () => {
      this.setState({
        refreshing: false
      });
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <PullToRefresh
          HeaderComponent={Header}
          headerHeight={100}
          refreshTriggerHeight={140}
          refreshingHoldHeight={140}
          refreshing={this.state.refreshing}
          onRefresh={this.onRefresh.bind(this)}
          style={{ flex: 1, backgroundColor: '#fff' }}
        >
          <ScrollView style={{ flex: 1, backgroundColor: '#24464D' }}>
            <View style={{width: '100%', height: 2000, backgroundColor: '#000', padding: 50}}></View>
          </ScrollView>
        </PullToRefresh>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002B36',
  },
});
