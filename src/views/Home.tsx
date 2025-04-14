import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  Platform,
} from 'react-native';
import React, {useState} from 'react';
import {HexColors} from '../utils/colors';
import {LinearGradient} from 'expo-linear-gradient';
import {NavigationProp, ParamListBase} from '@react-navigation/native';
import {useRecipes} from '../hooks/apiHooks';
import {useUpdateContext} from '../hooks/contextHooks';
import RecipeListItem from '../components/RecipeListItem';
import {RecipeWithOwnerExtended} from '../types/LocalTypes';
import SearchComponent from '../components/SearchBar';

const Home = ({navigation}: {navigation: NavigationProp<ParamListBase>}) => {
  const {recipeArray, loading} = useRecipes();
  const {triggerUpdate} = useUpdateContext();

  // state to store filtered recipes
  const [filteredRecipes, setFilteredRecipes] = useState<
    RecipeWithOwnerExtended[]
  >([]);

  // new state to track if any filters are active
  const [isFiltering, setIsFiltering] = useState(false);

  // handler for when filters change in SearchComponent
  const handleFilterChange = (
    filtered: RecipeWithOwnerExtended[],
    hasActiveFilters: boolean,
  ) => {
    setFilteredRecipes(filtered);
    setIsFiltering(hasActiveFilters);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
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
        <SearchComponent
          recipeArray={recipeArray || []}
          onFilterChange={handleFilterChange}
        />
        <FlatList
          data={isFiltering ? filteredRecipes : recipeArray}
          renderItem={({item}) => (
            <RecipeListItem item={item} navigation={navigation} />
          )}
          onRefresh={triggerUpdate}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No search results</Text>
            </View>
          }
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: HexColors['medium-green'],
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: 'white',
    fontSize: 16,
  },
});
