import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {Text, Card, Divider} from '@rneui/base';
import {AirbnbRating} from 'react-native-ratings';
import {HexColors} from '../utils/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {formatDateToTimePassed} from '../lib/functions';
import {ArrowDown, ArrowUp} from 'lucide-react-native';
import {useUserContext} from '../hooks/contextHooks';

type RatingItem = {
  rating_id: number;
  recipe_id: number;
  user_id: number;
  rating: number;
  review?: string;
  created_at: string;
  username: string;
};

type RatingsListProps = {
  ratings: RatingItem[];
  currentUserId?: number | null;
  onDeleteRating?: (rating_id: number) => void;
};

const RatingsDisplay = ({
  ratings,
  currentUserId,
  onDeleteRating,
}: RatingsListProps) => {
  // check if there isn't any ratings yet
  if (ratings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No ratings yet.</Text>
      </View>
    );
  }
  const [showRatings, setShowRatings] = useState(false);
  const {user} = useUserContext();
  // calculate the recipe's average rating
  const totalRating = ratings.reduce((acc, item) => acc + item.rating, 0);
  const averageRating = totalRating / ratings.length;

  // delete rating
  const handleDelete = (rating_id: number) => {
    // confirm the delete
    Alert.alert(
      'Delete Rating',
      'Are you sure you want to delete your rating?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteRating && onDeleteRating(rating_id),
        },
      ],
    );
  };

  // display the ratings
  const renderRatingItem = ({item}: {item: RatingItem}) => (
    <Card key={item.rating_id} containerStyle={styles.ratingCard}>
      <View style={styles.ratingHeader}>
        <Text style={styles.username}>{item.username || 'Anonymous'}</Text>
        <Text style={styles.date}>
          {formatDateToTimePassed(item.created_at.toString())}
        </Text>
      </View>

      <View style={styles.ratingStars}>
        <AirbnbRating
          count={5}
          size={16}
          showRating={false}
          isDisabled={true}
          defaultRating={item.rating}
          selectedColor={HexColors['medium-green']}
        />
      </View>

      {item.review && <Text style={styles.review}>{item.review}</Text>}

      {(currentUserId === item.user_id || user?.user_level_id === 1) &&
        onDeleteRating && (
          <TouchableOpacity
            testID="delete-rating"
            style={styles.deleteButton}
            onPress={() => handleDelete(item.rating_id)}
          >
            <Ionicons name="trash-outline" size={16} color="red" />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.summaryContainer}>
        <View style={styles.ratingAverage}>
          <AirbnbRating
            count={5}
            defaultRating={averageRating}
            size={24}
            showRating={false}
            isDisabled={true}
            selectedColor={HexColors['medium-green']}
          />
          <View>
            <Text style={{color: HexColors['dark-green'], fontWeight: 'bold'}}>
              {averageRating.toFixed(1)} / 5
            </Text>
            {ratings.length === 1 ? (
              <Text style={{color: HexColors['dark-green']}}>
                {ratings.length} rating
              </Text>
            ) : (
              <Text style={{color: HexColors['dark-green']}}>
                {ratings.length} ratings
              </Text>
            )}
          </View>
        </View>
      </View>
      <Divider style={styles.divider} />
      <TouchableOpacity
        testID="show-ratings"
        style={styles.ratingsButton}
        onPress={() => setShowRatings(!showRatings)}
      >
        <Text style={styles.sectionText}>
          {showRatings ? 'Hide ratings' : 'Show ratings'}
        </Text>
        {showRatings ? (
          <ArrowUp size={24} color={HexColors['dark-green']} />
        ) : (
          <ArrowDown size={24} color={HexColors['dark-green']} />
        )}
      </TouchableOpacity>
      {showRatings && (
        <View style={styles.listContent}>
          {ratings.map((item) => renderRatingItem({item}))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  sectionText: {
    fontSize: 16,
    fontFamily: 'InriaSans-Regular',
    marginBottom: 5,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'InriaSans-Regular',
    fontSize: 16,
    color: HexColors['dark-grey'],
    textAlign: 'center',
  },
  summaryContainer: {
    paddingVertical: 10,
  },
  summaryText: {
    fontFamily: 'InriaSans-Bold',
    fontSize: 18,
    color: HexColors['dark-green'],
  },
  divider: {
    marginVertical: 10,
  },
  listContent: {
    paddingBottom: 10,
  },
  ratingCard: {
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 0,
    marginVertical: 10,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ratingAverage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
    marginHorizontal: 30,
  },
  username: {
    fontFamily: 'InriaSans-Bold',
    fontSize: 16,
  },
  date: {
    fontFamily: 'InriaSans-Regular',
    fontSize: 12,
    color: HexColors['dark-grey'],
  },
  ratingStars: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  review: {
    fontFamily: 'InriaSans-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: HexColors['dark-grey'],
    marginTop: 5,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  deleteText: {
    fontFamily: 'InriaSans-Regular',
    fontSize: 14,
    color: 'red',
    marginLeft: 5,
  },
  ratingsButton: {
    backgroundColor: HexColors['almost-white'],
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
});

export default RatingsDisplay;
