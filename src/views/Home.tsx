import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  Platform,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {HexColors} from '../utils/colors';
import {LinearGradient} from 'expo-linear-gradient';
import {NavigationProp} from '@react-navigation/native';
import {useRecipes} from '../hooks/apiHooks';
import {useUpdateContext} from '../hooks/contextHooks';
import RecipeListItem from '../components/RecipeListItem';
import {
  NavigatorType,
  RecipeWithOwnerExtended,
  RecipeWithPossibleLikes,
} from '../types/LocalTypes';
import SearchComponent from '../components/SearchBar';
import {fetchData} from '../lib/functions';

const Home = ({navigation}: {navigation: NavigationProp<NavigatorType>}) => {
  const {recipeArray, loading} = useRecipes();
  const {triggerUpdate} = useUpdateContext();

  // state to store filtered recipes
  const [filteredRecipes, setFilteredRecipes] = useState<
    RecipeWithOwnerExtended[]
  >([]);

  // new state to track if any filters are active
  const [isFiltering, setIsFiltering] = useState(false);

  // Transform recipeArray to include likes_count
  const recipesWithLikes: RecipeWithOwnerExtended[] =
    recipeArray?.map((recipe: RecipeWithPossibleLikes) => ({
      ...recipe,
      likes_count: recipe.likes_count ?? 0,
    })) || [];

  // Handler for when filters change in SearchComponent
  const handleFilterChange = (
    filtered: RecipeWithOwnerExtended[],
    hasActiveFilters: boolean,
  ) => {
    setFilteredRecipes(filtered);
    setIsFiltering(hasActiveFilters);
  };

  // Fetch recipes with likes count
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const recipesData = await fetchData<RecipeWithPossibleLikes[]>(
          `${process.env.EXPO_PUBLIC_MEDIA_API}/recipes`,
        );

        const recipesWithLikes: RecipeWithOwnerExtended[] = recipesData.map(
          (recipe) => ({
            ...recipe,
            likes_count: recipe.likes_count ?? 0,
          }),
        );

        setFilteredRecipes(recipesWithLikes);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      }
    };

    fetchRecipes();
  }, []);

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
          recipeArray={recipesWithLikes}
          onFilterChange={handleFilterChange}
        />
        <FlatList
          data={isFiltering ? filteredRecipes : recipesWithLikes}
          renderItem={({item}) => (
            <RecipeListItem key={item.recipe_id} item={item} navigation={navigation} />
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
