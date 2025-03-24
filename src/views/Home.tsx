import {StyleSheet, Text} from 'react-native';
import React from 'react';
import {HexColors, HexGradients} from '../utils/colors';
import {LinearGradient} from 'expo-linear-gradient';

const Home = () => {
  return (
    <LinearGradient
      colors={[
        HexColors['medium-green'],
        HexColors.green,
        HexColors['darker-green'],
        HexColors['darkest-green'],
      ]}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
    ></LinearGradient>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
});
