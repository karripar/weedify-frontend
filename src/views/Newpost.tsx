import {StyleSheet} from 'react-native';
import React from 'react';
import {LinearGradient} from 'expo-linear-gradient';
import {HexColors} from '../utils/colors';

const Newpost = () => {
  return (
    <LinearGradient
      colors={[
        HexColors['medium-green'],
        HexColors['light-grey'],
        HexColors.grey
      ]}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      locations={[0, 0.4]}
    ></LinearGradient>
  );
};

export default Newpost;

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
});
