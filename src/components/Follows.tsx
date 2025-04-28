import {Follow} from 'hybrid-types/DBTypes';
import {useEffect, useReducer, useRef} from 'react';
import {useFollow} from '../hooks/apiHooks';
import { StyleSheet, Text, View, Animated, Pressable} from 'react-native';
import { HexColors } from '../utils/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FollowState = {
  count: number;
  userFollow: Follow | null;
};

type FollowAction = {
  type: 'setFollowCount' | 'follow';
  follow?: Follow | null;
  count?: number;
};

const followInitialState: FollowState = {
  count: 0,
  userFollow: null,
};

const followReducer = (
  state: FollowState,
  action: FollowAction,
): FollowState => {
  switch (action.type) {
    case 'setFollowCount':
      return {...state, count: action.count ?? 0};
    case 'follow':
      return {...state, userFollow: action.follow ?? null};
    default:
      return state;
  }
};

const Follows = ({userId}: {userId: number}) => {
  const [followState, followDispatch] = useReducer(
    followReducer,
    followInitialState,
  );
  const {getFollowedUsers, postFollow, removeFollow} = useFollow();

  const scaleAnimation = useRef(new Animated.Value(1)).current;

  const fetchFollowData = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token || !userId) return;

    try {
      const userFollows = await getFollowedUsers(token);

      // Check if the currently viewed userId is in the followed list
      const userFollow =
        userFollows.find((follow: Follow) => follow.followed_id === userId) ||
        null;

      followDispatch({type: 'follow', follow: userFollow});
    } catch (error) {
      followDispatch({type: 'follow', follow: null});
      console.error((error as Error).message);
    }
  };

  useEffect(() => {
    fetchFollowData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleFollow = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !userId) return;

      if (followState.userFollow) {
        // Remove follow
        await removeFollow(followState.userFollow.follow_id, token);

        followDispatch({type: 'follow', follow: null});
        followDispatch({type: 'setFollowCount', count: followState.count - 1});
      } else {
        // Add follow
        const response = await postFollow(userId, token);
        const newFollow = {
          follow_id: response.follow_id,
          follower_id: response.follower_id,
          followed_id: response.followed_id,
        };
        followDispatch({type: 'follow', follow: newFollow});
        followDispatch({type: 'setFollowCount', count: followState.count + 1});
      }
    } catch (error) {
      console.error((error as Error).message);
    } finally {
      fetchFollowData();
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnimation, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnimation, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
        <Pressable
          onPress={handleFollow}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [
            styles.button,
            followState.userFollow ? styles.unfollowButton : styles.followButton,
            pressed && styles.pressedButton,
          ]}
        >
          <Text style={styles.buttonText}>
            {followState.userFollow ? 'Unfollow' : 'Follow'}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

export default Follows;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  followButton: {
    backgroundColor: HexColors['light-green'],
  },
  unfollowButton: {
    backgroundColor: HexColors['grey'],
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  pressedButton: {
    opacity: 0.8,
  },
});
