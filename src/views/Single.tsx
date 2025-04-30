import {RecipeWithAllFields, User} from 'hybrid-types/DBTypes';
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
import {Card, Icon, Divider} from '@rneui/base';
import {useRecipes, useUser} from '../hooks/apiHooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useUpdateContext, useUserContext} from '../hooks/contextHooks';
import {useNavigation} from '@react-navigation/native';
import {HexColors} from '../utils/colors';
import {LinearGradient} from 'expo-linear-gradient';
import {useEffect, useState} from 'react';
import Comments from '../components/Comments';
import {ArrowUp, ArrowDown} from 'lucide-react-native';
import NutritionInfo from '../components/NutritionInfo';

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
  const {getUserWithProfileImage} = useUser();
  const {triggerUpdate} = useUpdateContext();
  const {deleteRecipe} = useRecipes();
  const navigation = useNavigation();
  const [showComments, setShowComments] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(
    process.env.EXPO_PUBLIC_UPLOADS + '/defaultprofileimage.png',
  );

  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        if (user) {
          const profileImage = await getUserWithProfileImage(item.user_id);
          if (profileImage && profileImage.filename) {
            setProfileImageUrl(profileImage.filename);
            console.log('profileimage uri', profileImageUrl);
          }
        }
      } catch (error) {
        console.error('Failed to load profile image:', error);
      }
    };

    loadProfileImage();
  }, [user]);

  // TODO: add delete and edit recipe functionality to the front, ALSO add comment, rating, like and save functionalities
  const handleDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const deleteResponse = await deleteRecipe(item.recipe_id, token);
      triggerUpdate();
      Alert.alert('Success', deleteResponse.message);
      navigation.goBack();
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete recipe');
    }
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
  nutritionSection: {
    flexDirection: 'column',
    marginLeft: 20,
    gap: 1,
    flex: 1,
    paddingRight: 20,
  },
});

export default Single;
