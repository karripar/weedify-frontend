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
import {Card, Icon, Divider, Button} from '@rneui/base';
import {useUser} from '../hooks/apiHooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useUserContext} from '../hooks/contextHooks';
import {HexColors} from '../utils/colors';
import {LinearGradient} from 'expo-linear-gradient';
import {useEffect, useState} from 'react';
import Comments from '../components/Comments';
import {ArrowUp, ArrowDown} from 'lucide-react-native';
import NutritionInfo from '../components/NutritionInfo';
import {useRatings} from '../hooks/apiHooks';
import RatingForm from '../components/RatingForm';
import RatingsDisplay from '../components/RatingsDisplay';

// Define an interface for nutrition data
interface NutritionData {
  energy_kcal: number;
  protein: number;
  fat: number;
  carbohydrate: number;
  fiber: number;
  sugar: number;
}

const Single = ({route}: any) => {
  // Extend the type to include the nutrition property
  const item: RecipeWithAllFields & {
    username: string;
    nutrition?: NutritionData;
  } = route.params.item;
  const {user} = useUserContext();
  const {getUserWithProfileImage, getUserById} = useUser();
  const [showComments, setShowComments] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    process.env.EXPO_PUBLIC_UPLOADS + '/defaultprofileimage.png',
  );
  // handle ratings and their display
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratings, setRatings] = useState<any[]>([]);
  const [userHasRated, setUserHasRated] = useState(false);
  const {postRating, getRatingsByRecipeId, checkRatingExists, deleteRating} =
    useRatings();

  // load ratings for the recipe
  const loadRatings = async () => {
    try {
      const ratingsData = await getRatingsByRecipeId(item.recipe_id);

      // get the username for the rating
      const ratingsWithUsernames = await Promise.all(
        ratingsData.map(
          async (rating: {user_id: number; [key: string]: any}) => {
            try {
              const userData = await getUserById(rating.user_id);
              return {
                ...rating,
                username: userData?.username || `User ${rating.user_id}`,
              };
            } catch (error) {
              return rating;
            }
          },
        ),
      );

      setRatings(ratingsWithUsernames);
    } catch (error) {
      console.error('Error loading ratings:', error);
      Alert.alert('Error', 'Could not load ratings');
    }
  };

  // check if user has already rated the recipe
  const checkUserRating = async () => {
    if (!user) return;

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const hasRated = await checkRatingExists(item.recipe_id, token);
      setUserHasRated(hasRated);
    } catch (error) {
      console.error('Error checking user rating:', error);
    }
  };

  // do rating
  const submitRating = async (ratingValue: number, reviewText: string) => {
    if (!user) {
      Alert.alert('Please log in to rate recipes');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'You need to be logged in');
        return;
      }

      await postRating(item.recipe_id, ratingValue, reviewText, token);

      // reload ratings and update user rating status
      loadRatings();
      setUserHasRated(true);
      Alert.alert('Success', 'Your rating has been submitted!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating');
    }
  };

  // delete rating
  const handleDeleteRating = async (rating_id: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await deleteRating(rating_id, token);

      // reload ratings and update user rating status
      loadRatings();
      setUserHasRated(false);
      Alert.alert('Success', 'Your rating has been deleted');
    } catch (error) {
      console.error('Error deleting rating:', error);
      Alert.alert('Error', 'Failed to delete rating');
    }
  };

  useEffect(() => {
    loadRatings();
    checkUserRating();
  }, [item.recipe_id, user]);

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
                uri: profileImageUrl ? profileImageUrl : process.env.EXPO_PUBLIC_UPLOADS + '/defaultprofileimage.png',
              }}
            />
            <View style={{flexDirection: 'column', marginLeft: 20, gap: 1}}>
              <Text style={{fontSize: 20}}>{item ? item.username : ''}</Text>
              <Text style={styles.dateText}>
                Posted on{' '}
                {new Date(item.created_at).toLocaleDateString('fi-FI')}
              </Text>
            </View>
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

          {item.nutrition && (
            <>
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
                  name="nutrition"
                  type="material-community"
                  color={HexColors['dark-green']}
                />
                <View style={styles.nutritionSection}>
                  <Text style={[styles.sectionTitle, {marginLeft: 5}]}>
                    Nutrition Information
                  </Text>
                  <NutritionInfo
                    energy={item.nutrition.energy_kcal}
                    protein={item.nutrition.protein}
                    fat={item.nutrition.fat}
                    carbohydrate={item.nutrition.carbohydrate}
                    fiber={item.nutrition.fiber}
                    sugar={item.nutrition.sugar}
                    perPortion={true}
                  />
                </View>
              </View>
              <Divider style={styles.divider} />
            </>
          )}

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

          <Divider
            style={[
              styles.divider,
              {borderWidth: 0.5, borderColor: HexColors['light-green']},
            ]}
          />
          <View style={styles.ratingsSection}>
            <Text style={[styles.sectionTitle, {marginHorizontal: 10}]}>
              Ratings
            </Text>

            <RatingsDisplay
              ratings={ratings}
              currentUserId={user?.user_id}
              onDeleteRating={handleDeleteRating}
            />
            {user ? (
              <Button
                title={
                  userHasRated ? "You've rated this recipe" : 'Rate this recipe'
                }
                buttonStyle={styles.rateButton}
                disabled={userHasRated}
                onPress={() => setShowRatingForm(true)}
              />
            ) : (
              <Text
                style={{
                  textAlign: 'center',
                  margin: 10,
                  color: HexColors['medium-green'],
                }}
              >
                Login to rate this recipe
              </Text>
            )}

            <RatingForm
              visible={showRatingForm}
              onClose={() => setShowRatingForm(false)}
              onSubmit={submitRating}
              recipe_id={item.recipe_id}
            />
          </View>
        </Card>
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
    borderWidth: 0,
  },
  imageContainer: {
    height: 50,
    width: 50,
    borderRadius: 25,
    backgroundColor: HexColors['light-purple'],
    borderWidth: 0,
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
  ratingsSection: {
    padding: 15,
  },
  rateButton: {
    backgroundColor: HexColors['medium-green'],
    borderRadius: 10,
    marginHorizontal: 10,
    marginVertical: 10,
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
  nutritionSection: {
    flexDirection: 'column',
    marginLeft: 20,
    gap: 1,
    flex: 1,
    paddingRight: 20,
  },
});

export default Single;
