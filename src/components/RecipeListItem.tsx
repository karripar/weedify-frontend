import {RecipeWithOwner} from 'hybrid-types/DBTypes';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {NavigationProp, ParamListBase} from '@react-navigation/native';
import {Button, Card, ListItem} from '@rneui/base';
import {HexColors} from '../utils/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useState, useEffect} from 'react';
import {useLikes, useUser} from '../hooks/apiHooks';
import {useUserContext, useUpdateContext} from '../hooks/contextHooks';
import {Alert} from 'react-native';

type RecipeListItemProps = {
  item: RecipeWithOwner & {likes_count?: number};
  navigation: NavigationProp<ParamListBase>;
};

const RecipeListItem = ({item, navigation}: RecipeListItemProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeId, setLikeId] = useState<number | null>(null);
  const [likesCount, setLikesCount] = useState(item.likes_count || 0);
  const {checkIfLiked, likeRecipe, unlikeRecipe} = useLikes();
  const {user} = useUserContext();
  const {update, setUpdate} = useUpdateContext();

  useEffect(() => {
    if (item && item.likes_count !== undefined) {
      setLikesCount(item.likes_count);
    }
  }, [item.likes_count]);

  // Check if the recipe is liked when component mounts
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (user) {
        try {
          // Check if the current user has liked this recipe
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

  // Handle like/unlike action
  const handleLikePress = async () => {
    if (!user) {
      // User needs to be logged in to like recipes
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
    <TouchableOpacity
      onPress={() => {
        navigation.navigate('Single', {item});
      }}
    >
      <Card containerStyle={styles.card}>
        <ListItem>
          <Text>{item.username}</Text>
        </ListItem>
        <ListItem>
          <Text>
            Posted on {new Date(item.created_at).toLocaleDateString('fi-FI')}
          </Text>
        </ListItem>
        <Image
          style={styles.image}
          source={{
            uri:
              item.thumbnail ||
              (item.screenshots && item.screenshots[2]) ||
              undefined,
          }}
        />
        <ListItem>
          <Text>{item.title}</Text>
        </ListItem>
        <ListItem>
          <Text>({item.cooking_time} min)</Text>
        </ListItem>
        <ListItem>
          <Text>{item.difficulty_level_id}</Text>
        </ListItem>
        <View
          style={[styles.flexView, {marginHorizontal: 20, marginVertical: 5}]}
        >
          <TouchableOpacity onPress={handleLikePress} style={styles.likeButton}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? 'red' : '#555'}
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

          <TouchableOpacity style={styles.commentButton}>
            <Ionicons name="chatbubble-outline" size={22} color="#555" />
            <Text style={styles.commentCount}>0</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.flexView}>
          <Button
            buttonStyle={[
              styles.button,
              {flex: 2, borderWidth: 1, borderColor: HexColors['light-grey']},
            ]}
            containerStyle={styles.buttonContainer}
            titleStyle={[styles.buttonTitle, {color: HexColors['dark-green']}]}
          >
            Add as favorite
          </Button>
          <Button
            buttonStyle={[
              styles.button,
              {flex: 1, backgroundColor: HexColors['dark-green']},
            ]}
            containerStyle={styles.buttonContainer}
            titleStyle={styles.buttonTitle}
          >
            Open
          </Button>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  image: {
    height: 230,
  },
  card: {
    paddingHorizontal: 0,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 0,
  },
  buttonTitle: {
    fontFamily: 'InriaSans-Regular',
    fontSize: 14,
    color: HexColors['light-purple'],
  },
  button: {
    backgroundColor: HexColors.white,
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 15,
    marginBottom: 10,
    marginHorizontal: 5,
    padding: 10,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    // iOS shadow
    shadowColor: HexColors['dark-grey'],
    shadowOffset: {
      width: 1,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    // Android shadow
    elevation: 5,
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
