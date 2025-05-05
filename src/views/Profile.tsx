import {
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
import {Bell} from 'lucide-react-native';
import Notifications from '../components/Notifications';
import {useNotificationContext} from '../contexts/NotificationContext';

const Profile = ({navigation}: {navigation: NavigationProp<ParamListBase>}) => {
  const {user, handleLogout} = useUserContext();
  const {getUserWithProfileImage, deleteUser} = useUser();
  const {triggerUpdate} = useUpdateContext();
  const {recipeArray, loading} = useRecipes(user?.user_id);
  const [profileMenu, setProfileMenu] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    process.env.EXPO_PUBLIC_UPLOADS_DIR + '/default/defaultprofileimage.png',
  );
  const {notificationCount} = useNotificationContext();
  const [notificationsVisible, setNotificationsVisible] =
    useState<boolean>(false);

  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        if (user) {
          const profileData = await getUserWithProfileImage(user.user_id);
          if (profileData && profileData.filename) {
            setProfileImageUrl(profileData.filename);
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
          onPress: async () => {
            try {
              await deleteUser();

              await handleLogout();

              Alert.alert('Success', 'Your profile has been deleted');
            } catch (error) {
              console.log('Failed to delete profile:', error);
              Alert.alert(
                'Error',
                'Failed to delete account. Please try again.',
              );
            }
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
          <RefreshControl refreshing={loading} onRefresh={triggerUpdate} />
        }
        scrollEnabled={notificationsVisible ? false : true}
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
              testID="profile-buttons"
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
                  testID="edit-profile-button"
                />
                <Text style={styles.menuText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDeleteProfile}
                testID="delete-profile-button"
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
                  testID="logout-button"
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
                uri: profileImageUrl
                  ? profileImageUrl
                  : process.env.EXPO_PUBLIC_UPLOADS_DIR +
                    '/default/defaultprofileimage.png',
              }}
            />
            <Text style={{marginHorizontal: 20, fontSize: 20}}>
              {user ? user.username : ''}
            </Text>
          </View>
        </Card>

        <TouchableOpacity
          aria-label="Toggle Notifications"
          style={styles.notiVisibilityToggle}
          onPress={() => {
            setNotificationsVisible(!notificationsVisible);
          }}
        >
          <Bell
            size={24}
            color={HexColors['dark-grey']}
            style={{marginRight: 10}}
          />
          <Text
            style={{
              fontSize: 16,
              color: HexColors['dark-grey'],
              fontWeight: '500',
            }}
          >
            Notifications
          </Text>
          {notificationCount > 0 && (
            <View
              style={{
                backgroundColor: HexColors['green'],
                borderRadius: 10,
                paddingHorizontal: 7,
                paddingVertical: 2,
                position: 'absolute',
                right: -3,
                top: -8,
              }}
            >
              <Text
                style={{
                  color: HexColors['almost-white'],
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                {notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Notifications
          visible={notificationsVisible}
          onClose={() => setNotificationsVisible(false)}
        />
        <Text
          style={{
            fontSize: 20,
            fontWeight: '600',
            color: HexColors['darker-green'],
            marginLeft: 20,
            marginVertical: 10,
            marginTop: 20,
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
            marginHorizontal: 20,
          }}
        >
          <Text>{user ? user.bio : 'Nothing on your user bio yet'}</Text>
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
  notiVisibilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: HexColors['almost-white'],
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
});
