import {RecipeWithAllFields, RecipeWithOwner} from 'hybrid-types/DBTypes';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import {NavigationProp, ParamListBase} from '@react-navigation/native';
import {Button, Card, Divider} from '@rneui/base';
import {HexColors} from '../utils/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useState, useEffect} from 'react';
import {useLikes, useUser} from '../hooks/apiHooks';
import {useUserContext, useUpdateContext} from '../hooks/contextHooks';

type RecipeListItemProps = {
  item:{
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
    dietary_info?: Array<{name: string; diet_type_id: number}>;
  };
  navigation: NavigationProp<ParamListBase>;
};

const RecipeListItem = ({item, navigation}: RecipeListItemProps) => {
  // Profile image loading logic
  const {getUserWithProfileImage} = useUser();
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(
    process.env.EXPO_PUBLIC_UPLOADS + '/defaultprofileimage.png',
  );

  // Like functionality state and hooks
  const [isLiked, setIsLiked] = useState(false);
  const [likeId, setLikeId] = useState<number | null>(null);
  const [likesCount, setLikesCount] = useState(item.likes_count || 0);
  const {checkIfLiked, likeRecipe, unlikeRecipe} = useLikes();
  const {user} = useUserContext();
  const {update, setUpdate} = useUpdateContext();

  // Load profile image
  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const profileImage = await getUserWithProfileImage(item.user_id);
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
    if (item && item.likes_count !== undefined) {
      setLikesCount(item.likes_count);
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
  }, [item.recipe_id, user]);

  // Get preview of description
  const getDescriptionPreview = () => {
    if (!item.instructions) return '';
    return item.instructions.length > 100
      ? item.instructions.substring(0, 100) + '...'
      : item.instructions;
  };

  // Handle like/unlike action
  const handleLikePress = async () => {
    if (!user) {
      Alert.alert('Login Required', 'You need to be logged in to like recipes');
      navigation.navigate('Login');
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

  return (
    <Card containerStyle={styles.card}>
      <View style={styles.userContainer}>
        <Image
          style={styles.userImage}
          source={{
            uri: profileImageUrl,
          }}
        />
        <View style={styles.userTextContainer}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.dateText}>
            Posted on {new Date(item.created_at).toLocaleDateString('fi-FI')}
          </Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons
            name="ellipsis-vertical"
            size={20}
            color={HexColors['dark-grey']}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Single', {item})}>
        <Image
          style={styles.recipeImage}
          source={{
            uri:
              item.filename ||
              process.env.EXPO_PUBLIC_UPLOADS + '/uploadimage.png',
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
                color={isLiked ? 'red' : HexColors['dark-grey']}
              />
              <Text
                style={[
                  styles.likeCount,
                  isLiked && {color: 'red', fontWeight: 'bold'},
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
        {item.dietary_info && item.dietary_info.length > 0 && (
          <View style={styles.dietContainer}>
            {item.dietary_info.map((diet, index) => (
              <View key={index} style={styles.dietChip}>
                <Text style={styles.dietText}>{diet.name}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.recipeDescription}>{getDescriptionPreview()}</Text>
      </View>

      <View style={styles.buttonRow}>
        <Button
          title="Add as favorite"
          buttonStyle={styles.favoriteButton}
          titleStyle={styles.favoriteButtonText}
          containerStyle={styles.buttonContainer}
        />
        <Button
          title="Open"
          buttonStyle={styles.openButton}
          titleStyle={styles.openButtonText}
          containerStyle={styles.buttonContainer}
          onPress={() => navigation.navigate('Single', {item})}
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
  dietChip: {
    marginRight: 6,
    paddingRight: 5,
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
