import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Pressable,
} from 'react-native';
import {NavigationProp, ParamListBase} from '@react-navigation/native';
import {Button, Card, Overlay} from '@rneui/base';
import {HexColors} from '../utils/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useState, useEffect} from 'react';
import {useLikes, useUser, useFavorites, useRecipes} from '../hooks/apiHooks';
import {useUserContext, useUpdateContext} from '../hooks/contextHooks';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RecipeListItemProps = {
  item: {
    likes_count?: number;
    diet_types?: Array<{name: string; diet_type_id: number}>;
    recipe_id: number;
    user_id: number;
    title: string;
    instructions?: string;
    cooking_time: number;
    portions: number;
    filename: string;
    media_type: string;
    created_at: string;
    username: string;
    screenshots?: string[];
  };
  navigation: NavigationProp<ParamListBase>;
};

const RecipeListItem = ({item, navigation}: RecipeListItemProps) => {
  // Profile image loading logic
  const {getUserWithProfileImage} = useUser();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    process.env.EXPO_PUBLIC_UPLOADS + '/defaultprofileimage.png',
  );

  // Like functionality state and hooks
  const [isLiked, setIsLiked] = useState(false);
  const [likeId, setLikeId] = useState<number | null>(null);
  const [likesCount, setLikesCount] = useState(item.likes_count || 0);
  const {checkIfLiked, likeRecipe, unlikeRecipe} = useLikes();
  const {user} = useUserContext();
  const {update, setUpdate} = useUpdateContext();
  const {deleteRecipe} = useRecipes();

  // check if favorite, add and remove favorites
  const [isFavorite, setIsFavorite] = useState(false);
  const {checkFavorite, addToFavorites, removeFromFavorites} = useFavorites();

  // recipe edit/delete overlay
  const [recipeOverlay, setRecipeOverlay] = useState(false);

  // toggle the visibilty of the overlay
  const toggleRecipeOverlay = () => {
    setRecipeOverlay(!recipeOverlay);
  };

  // handle edit recipe button click
  const handleEditRecipe = () => {
    setRecipeOverlay(false);
    navigation.navigate('Edit Recipe', {item});
  };

  // handle delete recipe button click
  const handleDeleteRecipe = () => {
    setRecipeOverlay(false);
    // confirmation alert
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // delete recipe
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) return;

              const deleteResponse = await deleteRecipe(item.recipe_id, token);
              setUpdate(!update);
              Alert.alert('Success', 'Recipe deleted successfully');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete recipe');
            }
          },
        },
      ],
    );
  };

  // Load profile image
  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const profileImage = await getUserWithProfileImage(item.user_id);
        console.log('Profile image:', profileImage);
        if (profileImage && profileImage.filename) {
          setProfileImageUrl(profileImage.filename);
        }
      } catch (error) {
        console.error('Failed to load profile image:', error);
      }
    };

    loadProfileImage();
  }, [item.user_id]);

  // Set likes count when it changes
  useEffect(() => {
    if (item && item.likes_count !== null) {
      setLikesCount(item.likes_count ?? 0);
    }
  }, [item.likes_count]);

  // Check if recipe is liked
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (user) {
        try {
          const response = await checkIfLiked(item.recipe_id);
          setIsLiked(response !== null);
          if (response) {
            setLikeId(response.like_id);
          }
        } catch (error) {
          console.error('Error fetching like status:', error);
        }
      }
    };

    fetchLikeStatus();
  }, [item.recipe_id, user, update]);

  // Handle like/unlike action
  const handleLikePress = async () => {
    if (!user) {
      Alert.alert('Login Required', 'You need to be logged in to like recipes');
      navigation.navigate('Weedify');
      return;
    }

    try {
      if (isLiked && likeId) {
        // Unlike the recipe
        const success = await unlikeRecipe(likeId);
        if (success) {
          setIsLiked(false);
          setLikeId(null);
          setLikesCount((prev) => Math.max(0, prev - 1));
          setUpdate(!update);
        }
      } else {
        // Like the recipe
        const success = await likeRecipe(item.recipe_id);
        if (success) {
          setIsLiked(true);
          setLikesCount((prev) => prev + 1);

          const response = await checkIfLiked(item.recipe_id);
          if (response) {
            setLikeId(response.like_id);
            setUpdate(!update);
          }
        }
      }
    } catch (error) {
      console.error('Error handling like:', error);
      Alert.alert('Error', 'Could not process your like. Please try again.');
    }
  };

  // check if recipe is added to favorites
  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (user) {
        try {
          const response = await checkFavorite(item.recipe_id);
          setIsFavorite(response !== false);
          return response;
        } catch (error) {
          console.error('Error fetching favorite status:', error);
        }
      }
    };

    fetchFavoriteStatus();
  }, [item.recipe_id, user, update]);

  // add or remove from favorite
  const handleAddToFavorite = async () => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to add favorite recipes',
      );
      return;
    }

    try {
      if (isFavorite === true) {
        // remove the recipe from favorites
        const success = await removeFromFavorites(item.recipe_id);
        if (success) {
          setIsFavorite(false);
          setUpdate(!update);
        }
      } else {
        // add the recipe to favorites
        const success = await addToFavorites(item.recipe_id);
        if (success) {
          setIsFavorite(true);

          const response = await checkFavorite(item.recipe_id);
          setUpdate(!update);
          return response;
        }
      }
    } catch (error) {
      console.error('Error at adding to favorites:', error);
      Alert.alert('Error', 'Could not add to favorites. Please try again.');
    }
  };

  // get preview of description
  const getDescriptionPreview = () => {
    if (!item.instructions) return '';
    return item.instructions.length > 100
      ? item.instructions.substring(0, 100) + '...'
      : item.instructions;
  };

  return (
    <Card containerStyle={styles.card}>
      <Pressable
      onPress={() => {
        if (user?.user_id === item.user_id) {
          navigation.navigate('Profile');
        } else {
          navigation.navigate('User Profile', { user_id: item.user_id, navigation});
        }
      }}
      style={styles.userContainer}>
        <Image
          style={styles.userImage}
          source={{
            uri: profileImageUrl ? profileImageUrl : process.env.EXPO_PUBLIC_UPLOADS + '/defaultprofileimage.png',
          }}

        />
        <View style={styles.userTextContainer}>
          <Text
          style={styles.username}>{item.username}</Text>
          <Text style={styles.dateText}>
            Posted on {new Date(item.created_at).toLocaleDateString('fi-FI')}
          </Text>
        </View>

        {user && (user.user_id === item.user_id || user.user_level_id === 1) && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={toggleRecipeOverlay}
            testID="recipe-overlay"
          >
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={HexColors['dark-grey']}
            />
          </TouchableOpacity>
        )}
        {user &&
          (user.user_id === item.user_id || user.user_level_id === 1) && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={toggleRecipeOverlay}
              testID="recipe-overlay"
            >
              <Ionicons
                name="ellipsis-vertical"
                size={20}
                color={HexColors['dark-grey']}
              />
            </TouchableOpacity>
          )}
        <Overlay
          isVisible={recipeOverlay}
          onBackdropPress={toggleRecipeOverlay}
          overlayStyle={styles.overlay}
        >
          <View>
            <TouchableOpacity
              style={styles.overlayItem}
              onPress={handleEditRecipe}
            >
              <Ionicons
                name="create-outline"
                size={24}
                color={HexColors['dark-grey']}
                style={{width: 30}}
              />
              <Text style={styles.overlayText} testID="edit-recipe-button">
                Edit Recipe
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.overlayItem}
              onPress={handleDeleteRecipe}
            >
              <Ionicons
                name="trash-outline"
                size={24}
                color="red"
                style={{width: 30}}
              />
              <Text style={[styles.overlayText, {color: 'red'}]}>
                Delete Recipe
              </Text>
            </TouchableOpacity>
          </View>
        </Overlay>
      </Pressable>
      <TouchableOpacity onPress={() => navigation.navigate('Recipe', {item})}>
        <Image
          style={styles.recipeImage}
          source={{
            uri: item.media_type.includes('image')
              ? item.filename
              : item.media_type.includes('video') && item.screenshots?.[0]
                ? item.screenshots[0]
                : process.env.EXPO_PUBLIC_UPLOADS + '/defaultrecipeimage.png',
          }}
        />
      </TouchableOpacity>

      <View style={styles.recipeInfoContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.recipeTitle}>
            {item.title}{' '}
            <Text style={styles.cookingTime}>({item.cooking_time}min)</Text>
          </Text>
          <View style={styles.iconGroup}>
            <TouchableOpacity
              onPress={handleLikePress}
              style={styles.iconButton}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={
                  isLiked ? HexColors['darkest-green'] : HexColors['dark-grey']
                }
              />
              <Text
                style={[
                  styles.likeCount,
                  isLiked && {
                    color: HexColors['darkest-green'],
                    fontWeight: 'bold',
                  },
                ]}
              >
                {likesCount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons
                name="chatbubble-outline"
                size={22}
                color={HexColors['dark-grey']}
              />
            </TouchableOpacity>
          </View>
        </View>
        {item.diet_types && item.diet_types.length > 0 && (
          <View style={styles.dietContainer}>
            <Text style={styles.dietText}>
              {item.diet_types.map((diet) => diet.name).join(', ')}
            </Text>
          </View>
        )}
        <Text style={styles.recipeDescription}>{getDescriptionPreview()}</Text>
      </View>

      <View style={styles.buttonRow}>
        <Button
          title={isFavorite ? 'Remove favorite' : 'Add as favorite'}
          buttonStyle={
            isFavorite ? styles.removeFavoriteButton : styles.favoriteButton
          }
          titleStyle={styles.favoriteButtonText}
          containerStyle={styles.buttonContainer}
          onPress={handleAddToFavorite}
          testID="add-favorite-button"
        />
        <Button
          title="Open"
          testID="view-recipe"
          buttonStyle={styles.openButton}
          titleStyle={styles.openButtonText}
          containerStyle={styles.buttonContainer}
          onPress={() => navigation.navigate('Recipe', {item})}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 0,
    marginHorizontal: 20,
    marginVertical: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: HexColors['dark-grey'],
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 0,
  },
  overlay: {
    width: 300,
    marginTop: -100,
    padding: 0,
    borderRadius: 10,
    backgroundColor: HexColors['light-purple'],
  },
  overlayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderRadius: 10,
    borderBottomColor: HexColors['light-grey'],
  },
  overlayText: {
    fontFamily: 'InriaSans-Regular',
    fontSize: 16,
    marginLeft: 10,
    color: HexColors['dark-grey'],
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: HexColors['light-purple'],
  },
  userTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  dateText: {
    fontSize: 12,
    color: HexColors['dark-grey'],
  },
  menuButton: {
    padding: 5,
  },
  recipeImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  recipeInfoContainer: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  cookingTime: {
    color: HexColors['dark-grey'],
    fontWeight: 'normal',
    fontSize: 14,
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dietContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  dietText: {
    color: HexColors['darker-green'],
    fontFamily: 'InriaSans-Regular',
  },
  recipeDescription: {
    fontSize: 14,
    color: HexColors['dark-grey'],
    marginTop: 4,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
  },
  buttonContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  removeFavoriteButton: {
    backgroundColor: HexColors['light-grey'],
    borderRadius: 20,
    paddingVertical: 8,
  },
  favoriteButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: HexColors['medium-green'],
    borderRadius: 20,
    paddingVertical: 8,
  },
  favoriteButtonText: {
    color: HexColors['dark-green'],
    fontSize: 14,
  },
  openButton: {
    backgroundColor: HexColors['dark-green'],
    borderRadius: 20,
    paddingVertical: 8,
  },
  openButtonText: {
    color: 'white',
    fontSize: 14,
  },
  flexView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 5,
    marginBottom: 10,
    marginHorizontal: 10,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 12,
  },
  likeCount: {
    marginLeft: 6,
    fontSize: 14,
    color: '#555',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  commentCount: {
    marginLeft: 6,
    fontSize: 14,
    color: '#555',
  },
});

export default RecipeListItem;
