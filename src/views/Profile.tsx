import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {LinearGradient} from 'expo-linear-gradient';
import {HexColors} from '../utils/colors';
import {NavigationProp, ParamListBase} from '@react-navigation/native';
import {useUpdateContext, useUserContext} from '../hooks/contextHooks';
import {Card, Icon, Image, Overlay, Text} from '@rneui/base';
import {View} from 'react-native';
import {useRecipes, useUser} from '../hooks/apiHooks';
import RecipeListItem from '../components/RecipeListItem';

const Profile = ({navigation}: {navigation: NavigationProp<ParamListBase>}) => {
  const {user, handleLogout} = useUserContext();
  const {getUserWithProfileImage} = useUser();
  const {triggerUpdate} = useUpdateContext();
  const [refreshing, setRefreshing] = useState(false);
  const {recipeArray, loading} = useRecipes(user?.user_id);
  const [profileMenu, setProfileMenu] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(
    process.env.EXPO_PUBLIC_UPLOADS + '/defaultprofileimage.png',
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    triggerUpdate();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        if (user) {
          const profileData = await getUserWithProfileImage(user.user_id);
          if (profileData && profileData.filename) {
            setProfileImageUrl(profileData.filename);
            console.log('profileimage uri', profileImageUrl);
          }
        }
      } catch (error) {
        console.error('Failed to load profile image:', error);
      }
    };

    loadProfileImage();
  }, [user]);

  // toggle overlay with edit, delete and logout
  const toggleMenu = () => {
    setProfileMenu(!profileMenu);
  };

  // edit profile
  const handleEditProfile = () => {
    setProfileMenu(false);
    navigation.navigate('Edit Profile');
  };

  // delete profile
  const handleDeleteProfile = () => {
    setProfileMenu(false);
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to delete your profile? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Profile deleted');
          },
        },
      ],
    );
  };

  // logout
  const logout = () => {
    setProfileMenu(false);
    handleLogout();
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
      <ScrollView
        contentContainerStyle={{flexGrow: 1}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card
          containerStyle={{
            borderRadius: 10,
            backgroundColor: HexColors['light-grey'],
            padding: 10,
          }}
        >
          <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
            <Icon
              name="ellipsis-horizontal"
              type="ionicon"
              color={HexColors['dark-grey']}
              size={24}
            />
          </TouchableOpacity>

          <Overlay
            isVisible={profileMenu}
            onBackdropPress={toggleMenu}
            overlayStyle={styles.overlay}
          >
            <View>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleEditProfile}
              >
                <Icon
                  name="edit"
                  type="material"
                  color={HexColors['dark-grey']}
                />
                <Text style={styles.menuText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDeleteProfile}
              >
                <Icon name="delete" type="material" color="red" />
                <Text style={[styles.menuText, {color: 'red'}]}>
                  Delete Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={logout}>
                <Icon
                  name="logout"
                  type="material"
                  color={HexColors['dark-grey']}
                />
                <Text style={styles.menuText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Overlay>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Image
              style={styles.image}
              containerStyle={styles.imageContainer}
              source={{
                uri: profileImageUrl,
              }}
            />
            <Text style={{marginHorizontal: 20, fontSize: 20}}>
              {user ? user.username : ''}
            </Text>
          </View>
        </Card>
        <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: HexColors['darker-green'],
              marginLeft: 20,
              marginVertical: 10,
              marginTop: 20
            }}
          >
            User bio
          </Text>
        <View
          style={{
            maxWidth: '100%',
            backgroundColor: HexColors['almost-white'],
            borderRadius: 10,
            padding: 20,
            marginHorizontal: 20
          }}
        >
          <Text>
            {user ? user.bio !== null : 'Nothing on your user bio yet'}
          </Text>
        </View>
        <View
          style={{
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: HexColors['darker-green'],
              marginBottom: 5,
              marginLeft: 20,
              marginTop: 20,
            }}
          >
            My posts
          </Text>

          {!loading && recipeArray.length === 0 && (
            <Text style={{textAlign: 'center', padding: 20}}>
              You haven't created any posts yet
            </Text>
          )}

          {recipeArray.map((recipe) => (
            <RecipeListItem
              key={recipe.recipe_id}
              item={recipe}
              navigation={navigation}
            />
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  imageContainer: {
    marginLeft: 8,
    height: 110,
    width: 110,
    borderRadius: 55,
    backgroundColor: HexColors['light-purple'],
  },
  image: {
    position: 'relative',
    margin: 5,
    height: 100,
    width: 100,
    borderRadius: 50,
    zIndex: 50,
  },
  menuButton: {
    position: 'absolute',
    right: 10,
    top: 5,
    zIndex: 1,
  },
  overlay: {
    width: 200,
    padding: 0,
    position: 'absolute',
    top: 90,
    right: 15,
    borderRadius: 10,
    backgroundColor: HexColors['light-purple'],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderRadius: 10,
    borderBottomColor: HexColors['light-grey'],
  },
  menuText: {
    marginLeft: 10,
    fontFamily: 'InriaSans-Regular',
    fontSize: 16,
    color: HexColors['dark-grey'],
  },
});
