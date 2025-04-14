import {Platform, SafeAreaView, StatusBar, StyleSheet} from 'react-native';
import React from 'react';
import {LinearGradient} from 'expo-linear-gradient';
import {HexColors} from '../utils/colors';
import Post from '../components/NewPostForm';

const Newpost = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        translucent
      />
      <Post />
    </SafeAreaView>
  );
};

export default Newpost;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: HexColors['medium-green'],
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    height: '100%',
  },
});
