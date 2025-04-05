import {FlatList, SafeAreaView, StyleSheet, Text} from 'react-native';
import React from 'react';
import {HexColors, HexGradients} from '../utils/colors';
import {LinearGradient} from 'expo-linear-gradient';
import {NavigationProp, ParamListBase} from '@react-navigation/native';
import {useRecipes} from '../hooks/apiHooks';
import {useUpdateContext} from '../hooks/contextHooks';
import RecipeListItem from '../components/RecipeListItem';

const Home = ({navigation}: {navigation: NavigationProp<ParamListBase>}) => {
  const {recipeArray, loading} = useRecipes();
  const {triggerUpdate} = useUpdateContext();
  return (
    <SafeAreaView>
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
      >
        <FlatList
          data={recipeArray}
          renderItem={({item}) => (
            <RecipeListItem item={item} navigation={navigation} />
          )}
          onRefresh={triggerUpdate}
          refreshing={loading}
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
});
