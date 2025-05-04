import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';

import {useUserContext} from '../hooks/contextHooks';
import Follows from '../components/Follows';
import {UserWithNoPassword} from 'hybrid-types/DBTypes';
import {useRecipes, useUser} from '../hooks/apiHooks';
import {HexColors} from '../utils/colors';
import {ScrollView} from 'react-native';
import RecipeListItem from '../components/RecipeListItem';
import {Card} from '@rneui/base';

const VisitedProfile = ({route, navigation}: any) => {
  const {user} = useUserContext();
  const {user_id} = route.params;
  const [visitedUser, setVisitedUser] = useState<UserWithNoPassword | null>(
    null,
  );
  const {getUserById} = useUser();
  const {recipeArray} = useRecipes(user_id);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserById(user_id);
        setVisitedUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, [user_id]);

  if (!visitedUser) {
    return (
      <View style={styles.centered}>
        <Text style={styles.username}>User not found.</Text>
      </View>
    );
  }

  const baseUploadURL = process.env.EXPO_PUBLIC_UPLOADS_DIR;
  const profileImageURL = visitedUser.filename
    ? visitedUser.filename
    : `${baseUploadURL}/default/defaultprofileimage.png`;

    console.log('profileImageURL', profileImageURL);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
          <Image
            source={{
              uri: profileImageURL,
            }}
            style={styles.avatar}
          />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{visitedUser.username}</Text>
        </View>
        <View>
          {user && user.user_id !== visitedUser.user_id && (
            <Follows userId={visitedUser.user_id} />
          )}
        </View>
      </View>
      <View>
        <Card containerStyle={styles.bioCard}>
          <Text>
            {visitedUser.bio
              ? visitedUser.bio
              : 'This user has not set a bio yet.'}
          </Text>
        </Card>
      </View>

      <Text style={styles.recipeTitle}>Recipes by {visitedUser.username}</Text>

      <ScrollView contentContainerStyle={styles.recipeList}>
        {recipeArray.map((item) => (
          <RecipeListItem
            key={item.recipe_id}
            item={item}
            navigation={navigation}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HexColors['light-purple'],
    padding: 16,
  },
  recipeInfo: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: HexColors['light-purple'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 2,
    borderColor: HexColors['dark-green'],
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: HexColors['dark-green'],
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: HexColors['green'],
    marginBottom: 12,
  },
  recipeCard: {
    padding: 12,
    backgroundColor: HexColors['almost-white'],
    borderRadius: 8,
    marginBottom: 10,
    borderColor: HexColors['light-grey'],
    borderWidth: 1,
  },
  recipeName: {
    fontSize: 16,
    color: HexColors['dark-grey'],
    fontWeight: '500',
  },
  recipeDate: {
    fontSize: 12,
    color: HexColors['grey'],
  },
  recipeList: {
    paddingBottom: 20,
  },
  bioCard: {
    backgroundColor: HexColors['almost-white'],
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: HexColors['light-grey'],
  },
});

export default VisitedProfile;
