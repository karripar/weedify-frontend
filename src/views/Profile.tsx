import {Alert, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import React, {useEffect, useState} from 'react';
import {LinearGradient} from 'expo-linear-gradient';
import {HexColors} from '../utils/colors';
import {NavigationProp, ParamListBase} from '@react-navigation/native';
import {useUserContext} from '../hooks/contextHooks';
import {Card, Icon, Image, Overlay, Text} from '@rneui/base';
import {View} from 'react-native';
import {useUser} from '../hooks/apiHooks';

const Profile = ({navigation}: {navigation: NavigationProp<ParamListBase>}) => {
  const {user, handleLogout} = useUserContext();
  const {getUserWithProfileImage} = useUser();
  const [profileMenu, setProfileMenu] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(
    process.env.EXPO_PUBLIC_UPLOADS + '/defaultprofileimage.png',
  );

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
        // Keep default image on error
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
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
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
        <View
          style={{
            maxWidth: '100%',
            backgroundColor: HexColors['almost-white'],
            borderRadius: 10,
            padding: 20,
            margin: 20,
          }}
        >
          <Text>{user ? user.bio : ''}</Text>
        </View>
        <Card
          containerStyle={{
            marginHorizontal: 20,
            borderRadius: 10,
            marginBottom: 20,
          }}
        >
          <Card.Title>My posts</Card.Title>
        </Card>
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
    height: 130,
    width: 130,
    borderRadius: 65,
    backgroundColor: HexColors['light-purple'],
  },
  image: {
    position: 'relative',
    margin: 5,
    height: 120,
    width: 120,
    borderRadius: 60,
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
    top: 80,
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
