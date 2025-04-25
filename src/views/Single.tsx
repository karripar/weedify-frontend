import {RecipeWithAllFields} from 'hybrid-types/DBTypes';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import VideoPlayer from '../components/VideoPlayer';
import {Card, Icon, Divider, Overlay} from '@rneui/base';
import {useRecipes, useUser} from '../hooks/apiHooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useUpdateContext, useUserContext} from '../hooks/contextHooks';
import {
  NavigationProp,
  ParamListBase,
  useNavigation,
} from '@react-navigation/native';
import {HexColors} from '../utils/colors';
import {LinearGradient} from 'expo-linear-gradient';
import {useEffect, useState} from 'react';
import Comments from '../components/Comments';
import {ArrowUp, ArrowDown} from 'lucide-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Single = ({route}: any) => {
  const item: RecipeWithAllFields & {username: string} = route.params.item;
  const {user} = useUserContext();
  const {getUserWithProfileImage} = useUser();
  const {update, setUpdate} = useUpdateContext();
  const {deleteRecipe} = useRecipes();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [showComments, setShowComments] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(
    process.env.EXPO_PUBLIC_UPLOADS + '/defaultprofileimage.png',
  );
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
              console.log('recipe deleted', deleteResponse);
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

  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        if (user) {
          const profileImage = await getUserWithProfileImage(item.user_id);
          if (profileImage && profileImage.filename) {
            setProfileImageUrl(profileImage.filename);
          }
        }
      } catch (error) {
        console.error('Failed to load profile image:', error);
      }
    };

    loadProfileImage();
  }, [user]);

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
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <Card containerStyle={styles.card}>
          <View
            style={{flexDirection: 'row', alignItems: 'center', padding: 20}}
          >
            <Image
              style={styles.imageContainer}
              source={{
                uri: profileImageUrl,
              }}
            />
            <View style={{flexDirection: 'column', marginLeft: 20, gap: 1}}>
              <Text style={{fontSize: 20}}>{item ? item.username : ''}</Text>
              <Text style={styles.dateText}>
                Posted on{' '}
                {new Date(item.created_at).toLocaleDateString('fi-FI')}
              </Text>
            </View>

            {user && user.user_id === item.user_id && (
              <TouchableOpacity onPress={toggleRecipeOverlay}>
                <Ionicons
                  name="ellipsis-vertical"
                  size={24}
                  color={HexColors['dark-grey']}
                  style={{marginLeft: 70}}
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
                  <Text style={styles.overlayText}>Edit Recipe</Text>
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
          </View>

          {item.media_type.includes('image') ? (
            <Image
              style={styles.image}
              source={{uri: item.filename}}
              resizeMode="cover"
            />
          ) : (
            <VideoPlayer videoFile={item.filename} style={styles.image} />
          )}

          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Icon name="schedule" size={18} color={HexColors['dark-green']} />
              <Text style={styles.infoText}>{item.cooking_time} min</Text>
            </View>

            <View style={styles.infoItem}>
              <Icon
                name="restaurant"
                size={18}
                color={HexColors['dark-green']}
              />
              <Text style={styles.infoText}>{item.portions} servings</Text>
            </View>

            <View style={styles.infoItem}>
              <Icon
                name="bar-chart"
                size={18}
                color={HexColors['dark-green']}
              />
              <Text style={styles.infoText}>{item.difficulty_level}</Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              gap: 1,
              marginVertical: 20,
              marginLeft: 20,
              alignItems: 'flex-start',
            }}
          >
            <Icon name="local-dining" color={HexColors['dark-green']} />
            <View style={{flexDirection: 'column', marginLeft: 20, gap: 1}}>
              <Text style={[styles.sectionTitle, {marginLeft: 5}]}>
                {item.title}
              </Text>
              {item.diet_types && item.diet_types.length > 0 ? (
                item.diet_types.map((diet) => (
                  <View key={diet.diet_type_id} style={styles.dietChip}>
                    <Text style={styles.dietText}>{diet.name}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.dietChip}>
                  <Text style={styles.dietText}>No special diets</Text>
                </View>
              )}
            </View>
          </View>

          <Divider style={styles.divider} />

          <View
            style={{
              flexDirection: 'row',
              gap: 1,
              marginVertical: 20,
              marginLeft: 20,
              alignItems: 'flex-start',
            }}
          >
            <Icon
              name="food-variant"
              type="material-community"
              color={HexColors['dark-green']}
            />
            <View style={{flexDirection: 'column', marginLeft: 20, gap: 1}}>
              <Text style={[styles.sectionTitle, {marginLeft: 5}]}>
                Ingredients
              </Text>
              <View style={{marginLeft: 5}}>
                {item.ingredients &&
                  item.ingredients.map((ingredient, index) => (
                    <Text key={index} style={styles.ingredientText}>
                      • {ingredient.amount} {ingredient.unit} {ingredient.name}
                    </Text>
                  ))}
              </View>
            </View>
          </View>
          <Divider style={styles.divider} />

          <View
            style={{
              flexDirection: 'row',
              gap: 1,
              marginVertical: 20,
              marginLeft: 20,
              alignItems: 'flex-start',
            }}
          >
            <Icon
              name="text-box-outline"
              type="material-community"
              color={HexColors['dark-green']}
            />
            <View
              style={{
                flexDirection: 'column',
                marginLeft: 20,
                gap: 1,
                flex: 1,
                paddingRight: 20,
              }}
            >
              <Text style={[styles.sectionTitle, {marginLeft: 5}]}>
                Instructions
              </Text>
              <Text style={[styles.instructionsText, {marginLeft: 5}]}>
                {item.instructions}
              </Text>
            </View>
          </View>
        </Card>
        <Divider style={styles.divider} />
        <View>
          <TouchableOpacity
            style={styles.commentsButton}
            onPress={() => setShowComments(!showComments)}
          >
            <Text style={styles.sectionTitle}>
              {showComments ? 'Hide Comments' : 'Show Comments'}
            </Text>
            {showComments ? (
              <ArrowUp size={24} color={HexColors['dark-green']} />
            ) : (
              <ArrowDown size={24} color={HexColors['dark-green']} />
            )}
          </TouchableOpacity>
          {showComments && (
            <View style={{marginBottom: 20}}>
              <Comments item={item} />
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  card: {
    borderRadius: 10,
    padding: 0,
    margin: 20,
    marginBottom: 40,
  },
  overlay: {
    position: 'absolute',
    top: 120,
    right: 15,
    width: 250,
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
  imageContainer: {
    height: 50,
    width: 50,
    borderRadius: 25,
    backgroundColor: HexColors['light-purple'],
  },
  image: {
    width: '100%',
    height: 250,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: HexColors['almost-white'],
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 5,
    fontFamily: 'InriaSans-Regular',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'InriaSans-Bold',
    marginBottom: 8,
    color: HexColors['dark-green'],
    fontWeight: 'bold',
  },
  sectionText: {
    fontSize: 16,
    fontFamily: 'InriaSans-Regular',
  },
  dateText: {
    fontSize: 14,
    color: 'gray',
    fontFamily: 'InriaSans-Regular',
  },
  dietContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dietChip: {
    paddingHorizontal: 5,
  },
  dietText: {
    color: HexColors['darker-green'],
    fontFamily: 'InriaSans-Regular',
  },
  ingredientText: {
    fontSize: 16,
    marginVertical: 2,
    fontFamily: 'InriaSans-Regular',
    lineHeight: 22,
  },
  instructionsText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'InriaSans-Regular',
  },
  deleteButton: {
    backgroundColor: 'crimson',
    borderRadius: 10,
    marginVertical: 15,
  },
  buttonContainer: {
    marginHorizontal: 20,
  },
  commentsButton: {
    backgroundColor: HexColors['almost-white'],
    borderRadius: 10,
    padding: 10,
    marginVertical: 15,
    marginHorizontal: 20,
    alignItems: 'center',
  },
});

export default Single;
