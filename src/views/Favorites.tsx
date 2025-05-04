import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {LinearGradient} from 'expo-linear-gradient';
import {HexColors} from '../utils/colors';
import {useFavorites} from '../hooks/apiHooks';
import {useUpdateContext, useUserContext} from '../hooks/contextHooks';
import {NavigationProp, ParamListBase} from '@react-navigation/native';
import {RecipeWithAllFields} from 'hybrid-types/DBTypes';
import {Button, Card, ListItem, Text} from '@rneui/base';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Favorites = ({
  navigation,
}: {
  navigation: NavigationProp<ParamListBase>;
}) => {
  const {user} = useUserContext();
  const {update, setUpdate} = useUpdateContext();
  const {getAllFavorites, removeFromFavorites} = useFavorites();
  const [favoriteRecipes, setFavoriteRecipes] = useState<RecipeWithAllFields[]>(
    [],
  );

  // get all the user favorites if user is logged in
  useEffect(() => {
    const getUserFavorites = async () => {
      if (!user) {
        setFavoriteRecipes([]);
        return;
      }

      try {
        // fetch the favorites
        const userFavorites = await getAllFavorites();
        if (userFavorites !== null) {
          // if favorites, return them in a list
          setFavoriteRecipes(userFavorites.reverse());
        } else {
          // if no favorites return empty list
          setFavoriteRecipes([]);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    };
    getUserFavorites();
  }, [user, update]);

  // remove favorite
  const removeFavorite = async (recipe_id: number) => {
    try {
      const remove = await removeFromFavorites(recipe_id);
      if (remove) {
        // remove the favorite from the favorite page
        setFavoriteRecipes((prev) =>
          prev.filter((recipe) => recipe.recipe_id !== recipe_id),
        );
        setUpdate(!update);
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert(
        'Error',
        'Could not remove from favorites. Please try again.',
      );
    }
  };

  // remove favorite confirmation alert
  const confirmRemove = (recipe_id: number) => {
    Alert.alert(
      'Remove favorite',
      'Are you sure you want to remove this recipe from your favorites?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {text: 'Remove', onPress: () => removeFavorite(recipe_id)},
      ],
    );
  };

  return (
    <LinearGradient
      colors={[
        HexColors['medium-green'],
        HexColors['light-grey'],
        HexColors.grey,
      ]}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      locations={[0, 0.4, 1]}
    >
      {!user ? (
        <View style={styles.centerContainer}>
          <Text style={styles.message}>
            Please log in to see your favorites
          </Text>
        </View>
      ) : favoriteRecipes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.message}>No favorites yet</Text>
        </View>
      ) : (
        <FlatList
          data={favoriteRecipes}
          keyExtractor={(item) => item.recipe_id.toString()}
          renderItem={({item}) => (
            <Card containerStyle={styles.card}>
              <ListItem
                containerStyle={{
                  borderRadius: 10,
                  backgroundColor: HexColors['almost-white'],
                }}
              >
                <ListItem.Content
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <TouchableOpacity
                    onPress={() => confirmRemove(item.recipe_id)}
                  >
                    <Ionicons
                      name="trash"
                      size={25}
                      color={HexColors['medium-green']}
                    />
                  </TouchableOpacity>
                  <View
                    style={{
                      flexDirection: 'column',
                      gap: 3,
                      flex: 2,
                      paddingHorizontal: 20,
                    }}
                  >
                    <ListItem.Title>{item.title}</ListItem.Title>
                    <ListItem.Subtitle>
                      <View
                        style={{
                          flexWrap: 'wrap',
                          flexDirection: 'row',
                        }}
                      >
                        {item.diet_types && item.diet_types.length > 0 ? (
                          <Text
                            style={{
                              paddingVertical: 3,
                              color: HexColors['medium-green'],
                              fontFamily: 'InriaSans-Regular',
                            }}
                          >
                            {item.diet_types
                              .map((dietType) => dietType.name)
                              .join(', ')}
                          </Text>
                        ) : (
                          <Text>No special diets</Text>
                        )}
                      </View>
                    </ListItem.Subtitle>
                  </View>
                  <Button
                    title="View"
                    buttonStyle={styles.openButton}
                    titleStyle={styles.openButtonText}
                    containerStyle={styles.buttonContainer}
                    onPress={() => navigation.navigate('Recipe', {item})}
                    testID="view-recipe"
                  />
                </ListItem.Content>
              </ListItem>
            </Card>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </LinearGradient>
  );
};

export default Favorites;

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  card: {
    borderRadius: 10,
    padding: 10,
    margin: 10,
    backgroundColor: HexColors['light-purple'],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 18,
    color: HexColors['dark-grey'],
    fontFamily: 'InriaSans-Regular',
  },
  listContainer: {
    paddingVertical: 10,
  },
  buttonContainer: {
    marginHorizontal: 4,
  },
  openButton: {
    backgroundColor: HexColors['dark-green'],
    borderRadius: 20,
    paddingVertical: 8,
    width: 70,
  },
  openButtonText: {
    color: 'white',
    fontSize: 14,
  },
});
