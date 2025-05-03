import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {HexColors} from '../utils/colors';
import {Button, Card, Image, Input} from '@rneui/base';
import MultiSelect from 'react-native-multiple-select';

import {useDietTypes, useFile, useUser} from '../hooks/apiHooks';
import {NavigationProp, ParamListBase} from '@react-navigation/native';
import {useUpdateContext, useUserContext} from '../hooks/contextHooks';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Controller, useForm} from 'react-hook-form';
import {LinearGradient} from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {UserWithDietaryInfo} from 'hybrid-types/DBTypes';

type UpdateInputs = {
  username: string;
  email: string;
  current_password: string;
  new_password: string;
  bio: string;
  dietary_restrictions: string;
};

const EditProfileForm = ({
  navigation,
}: {
  navigation: NavigationProp<ParamListBase>;
}) => {
  const {user, setUpdatedUser} = useUserContext();
  const {postProfileImageFile, loading} = useFile();
  const {
    updateUser,
    changePassword,
    getUserById,
    getUsernameAvailable,
    getEmailAvailable,
    getUserDietaryRestrictions,
    getUserWithProfileImage,
  } = useUser();
  const {triggerUpdate, update} = useUpdateContext();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    process.env.EXPO_PUBLIC_UPLOADS_DIR + '/default/defaultprofileimage.png',
  );

  const [image, setImage] = useState<ImagePicker.ImagePickerResult | null>(
    null,
  );

  // fetch and set all dietypes to the selector
  const {getAllDietTypes} = useDietTypes();
  const [dietTypeOptions, setDietTypeOptions] = useState<
    {key: string; value: string}[]
  >([]);

  // user's existing diets
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);

  // toggle the visibility of the password
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] =
    useState(true);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(true);

  const toggleCurrentPasswordVisibility = () => {
    setIsCurrentPasswordVisible(!isCurrentPasswordVisible);
  };

  const toggleNewPasswordVisibility = () => {
    setIsNewPasswordVisible(!isNewPasswordVisible);
  };

  const initValues: UpdateInputs = {
    username: '',
    email: '',
    current_password: '',
    new_password: '',
    bio: '',
    dietary_restrictions: '',
  };
  const {
    control,
    handleSubmit,
    formState: {errors, isValid},
    reset,
    trigger,
  } = useForm({
    defaultValues: initValues,
  });

  // reset the updated user data
  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        email: user.email,
        bio: user.bio || '',
        dietary_restrictions: user.dietary_restrictions || '',
      });
    }
  }, [user, update]);

  // data for diet types
  useEffect(() => {
    const fetchDietTypes = async () => {
      try {
        // get all diet types from the db
        const allDietTypes = await getAllDietTypes();

        if (Array.isArray(allDietTypes)) {
          // map the diettypes to get the id and name of the diet
          const dietTypes = allDietTypes.map((dietType) => ({
            key: dietType.diet_type_id.toString(),
            value: dietType.diet_type_name,
          }));
          setDietTypeOptions(dietTypes);
        } else {
          setDietTypeOptions([]);
        }
      } catch (error) {
        console.error('Error fetching diet types:', error);
      }
    };
    fetchDietTypes();
  }, []);

  // fetch user's existing diets to add them to the form
  useEffect(() => {
    const fetchUserDiets = async () => {
      if (user) {
        try {
          const userDiets = await getUserDietaryRestrictions(user?.user_id);
          setSelectedDiets(userDiets);
        } catch (error) {
          console.error('Error fetching diets:', error);
        }
      }
    };
    fetchUserDiets();
  }, [user, update]);

  // set new selected diets if user adds/removes diets from the diet list
  useEffect(() => {
    if (selectedDiets?.length > 0) {
    }
  }, [selectedDiets]);

  // fetch user's existing profile picture
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

  // select image for the post
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.4,
    });

    if (!result.canceled) {
      setImage(result);
    }
  };

  // do edit
  const doEditProfile = async (inputs: UpdateInputs) => {
    const token = await AsyncStorage.getItem('token');
    if (!token || !user) {
      Alert.alert('Error', 'No token found, please login.');
      return;
    }

    // create update object with fields to update
    const updateData: Record<string, string | string[] | number[] | null> = {};

    // only add non-empty fields with proper validation
    if (inputs.username && inputs.username.trim().length >= 3) {
      updateData.username = inputs.username;
    }

    if (inputs.email && inputs.email.includes('@')) {
      updateData.email = inputs.email;
    }

    // send the text in the bio field or an empty string
    updateData.bio = inputs.bio != null ? inputs.bio.trim() : '';

    // get diet type ids from the selected names
    const dietTypeIds = selectedDiets
      .map((dietName) => {
        // find the id that corresponds to the selected diet name
        const dietOption = dietTypeOptions.find(
          (option) => option.value === dietName,
        );
        return dietOption ? Number(dietOption.key) : null;
      })
      .filter((id) => id !== null);

    // add dietary info if not empty
    if (dietTypeIds.length > 0) {
      updateData.dietary_restrictions = dietTypeIds.join(',');
    }

    // handle profile image (both with and without new image)
    let fileResponse;
    console.log('Image after clicking update:', image);
    if (image && image.assets) {
      fileResponse = await postProfileImageFile(image.assets[0].uri, token);
      console.log('File response:', fileResponse);
      if (!fileResponse) {
        Alert.alert('Upload failed');
        return;
      }

      // Add image data to update only if a new image was uploaded
      updateData.filename = fileResponse.data.filename;
      updateData.media_type = fileResponse.data.media_type || 'image/jpeg';
      updateData.filesize = fileResponse.data.filesize.toString();
    }

    try {
      // update user with provided data
      const editResponse = await updateUser(
        token,
        fileResponse || {
          data: {filename: null, media_type: null, filesize: null},
        },
        updateData,
        user.user_id,
      );

      // handle password change if current and new password is set
      if (inputs.current_password && inputs.new_password) {
        try {
          await changePassword(inputs.current_password, inputs.new_password);
        } catch (error) {
          console.error('Password change error:', error);
        }
      }

      try {
        const updatedUserData = await getUserById(user.user_id);

        if (updatedUserData) {
          // format the user data to include the profile image
          const formattedUser = {
            ...updatedUserData,
            profile_picture:
              'profile_picture' in updatedUserData
                ? updatedUserData.profile_picture
                : '',
          } as UserWithDietaryInfo;

          reset({
            username: updatedUserData.username,
            email: updatedUserData.email,
            bio: updatedUserData.bio || '',
            dietary_restrictions: updatedUserData.dietary_restrictions || '',
          });

          setImage(null);
          setUpdatedUser(formattedUser);
        }
      } catch (fetchError) {
        console.error('Error fetching updated user:', fetchError);
      }

      triggerUpdate();
      if (editResponse && editResponse.message) {
        Alert.alert('Update successful', editResponse.message);
      } else {
        Alert.alert('Update successful', 'User data up to date');
      }
      navigation.navigate('Back', {screen: 'Profile'});
    } catch (error) {
      console.error('User update error:', error);
      Alert.alert('Update failed', (error as Error).message || 'Unknown error');
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {});
    return () => {
      unsubscribe();
    };
  }, []);

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
      <FlatList
        data={[
          {
            component: (
              <>
                <Image
                  containerStyle={{margin: 'auto'}}
                  source={
                    image?.assets && image.assets[0]
                      ? {uri: image.assets[0].uri}
                      : {
                          uri:
                            profileImageUrl ||
                            `${process.env.EXPO_PUBLIC_UPLOADS}/uploadimage.png`,
                        }
                  }
                  style={[
                    styles.image,
                    {
                      objectFit: image?.assets?.[0].uri ? 'cover' : 'contain',
                      margin: 'auto',
                    },
                  ]}
                  onPress={pickImage}
                />
                <Text style={styles.text}>Username</Text>

                <Controller
                  control={control}
                  rules={{
                    maxLength: {value: 20, message: 'maximum 20 characters'},
                    minLength: {value: 3, message: 'minimum 3 characters'},
                    validate: async (value) => {
                      if (!value || value.length < 3) {
                        return 'minimum 3 characters';
                      }
                      // the current user's username wont be checked
                      if (user && value === user.username) {
                        return true;
                      }
                      try {
                        const {available} = await getUsernameAvailable(value);
                        return available ? true : 'username not available';
                      } catch (error) {
                        console.error((error as Error).message);
                      }
                    },
                  }}
                  render={({field: {onChange, onBlur, value}}) => (
                    <Input
                      style={styles.input}
                      inputContainerStyle={styles.inputContainer}
                      onBlur={onBlur}
                      onChangeText={(input) => {
                        onChange(input);
                        if (input.length >= 3) {
                          trigger('username');
                        }
                      }}
                      value={value}
                      autoCapitalize="none"
                      errorMessage={errors.username?.message}
                      testID="username-input"
                    />
                  )}
                  name="username"
                />

                <Text style={styles.text}>Email</Text>
                <Controller
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                      message: 'not a valid email',
                    },
                    minLength: {value: 3, message: 'minimum length is 3'},
                    maxLength: 50,
                    validate: async (value) => {
                      if (!value || value.length < 3) {
                        return 'minimum 3 characters';
                      }
                      // the current user's email wont be checked
                      if (user && value === user.email) {
                        return true;
                      }
                      try {
                        const {available} = await getEmailAvailable(value);
                        return available ? true : 'email not available';
                      } catch (error) {
                        console.error((error as Error).message);
                      }
                    },
                  }}
                  render={({field: {onChange, onBlur, value}}) => (
                    <Input
                      style={styles.input}
                      inputContainerStyle={styles.inputContainer}
                      onBlur={onBlur}
                      onChangeText={(input) => {
                        onChange(input);
                        if (input.length >= 3) {
                          trigger('email');
                        }
                      }}
                      value={value}
                      autoCapitalize="none"
                      errorMessage={errors.email?.message}
                      testID="email-input"
                    />
                  )}
                  name="email"
                />

                <Text style={styles.text}>Bio</Text>
                <Controller
                  control={control}
                  rules={{
                    maxLength: {value: 200, message: 'maximum 200 characters'},
                  }}
                  render={({field: {onChange, onBlur, value}}) => (
                    <Input
                      style={[styles.input, styles.instructionsInput]}
                      inputContainerStyle={styles.inputContainer}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      errorMessage={errors.bio?.message}
                      multiline={true}
                      numberOfLines={6}
                      textAlignVertical="top"
                      testID="bio-input"
                    />
                  )}
                  name="bio"
                />

                <Text style={[styles.text, {marginTop: 20}]}>
                  Diet restrictions
                </Text>
                <View style={{flex: 5}}>
                  <MultiSelect
                    items={dietTypeOptions}
                    uniqueKey="value"
                    displayKey="value"
                    onSelectedItemsChange={(items) => {
                      // 5 is the limit for diet restrictions
                      if (items.length > 5) {
                        Alert.alert(
                          'Selection limit reached',
                          'You can select a maximum of 5 dietary restrictions.',
                          [{text: 'OK'}],
                        );
                        return;
                      }
                      setSelectedDiets(items);
                    }}
                    selectedItems={selectedDiets}
                    selectText="Select dietary destrictions"
                    searchInputPlaceholderText="Search diets..."
                    tagRemoveIconColor={HexColors['grey']}
                    tagTextColor={HexColors['dark-green']}
                    tagBorderColor={HexColors['light-green']}
                    selectedItemTextColor={HexColors['light-green']}
                    selectedItemIconColor={HexColors['light-green']}
                    itemTextColor={HexColors['dark-grey']}
                    styleRowList={{
                      paddingVertical: 5,
                    }}
                    styleItemsContainer={{
                      paddingVertical: 10,
                    }}
                    searchInputStyle={{
                      color: HexColors['dark-grey'],
                      marginBottom: 20,
                      marginTop: 10,
                    }}
                    styleMainWrapper={{
                      marginHorizontal: 10,
                      overflow: 'hidden',
                      borderRadius: 10,
                    }}
                    submitButtonColor={HexColors['light-green']}
                    submitButtonText="Add"
                  />
                </View>
                <Text
                  style={{
                    margin: 5,
                    marginTop: 30,
                    marginVertical: 20,
                    fontSize: 20,
                    color: HexColors['medium-green'],
                  }}
                >
                  Change Password
                </Text>
                <Text
                  style={{
                    marginHorizontal: 10,
                    fontWeight: '200',
                    marginBottom: 10,
                  }}
                >
                  Fill in your current and new password to change your password
                </Text>
                <Text style={styles.text}>Current password</Text>
                <Controller
                  control={control}
                  rules={{
                    minLength: {value: 8, message: 'minimum 8 characters'},
                  }}
                  render={({field: {onChange, onBlur, value}}) => (
                    <Input
                      secureTextEntry={isCurrentPasswordVisible}
                      value={value}
                      onChangeText={onChange}
                      style={styles.input}
                      inputContainerStyle={styles.inputContainer}
                      rightIcon={
                        <TouchableOpacity
                          onPress={toggleCurrentPasswordVisibility}
                        >
                          <Ionicons
                            name={
                              isCurrentPasswordVisible
                                ? 'eye-outline'
                                : 'eye-off-outline'
                            }
                            size={25}
                            style={{paddingHorizontal: 10}}
                            color={HexColors['dark-grey']}
                          />
                        </TouchableOpacity>
                      }
                      onBlur={onBlur}
                      errorMessage={errors.current_password?.message}
                      autoCapitalize="none"
                      testID="current-password"
                    />
                  )}
                  name="current_password"
                />
                <Text style={styles.text}>New password</Text>
                <Controller
                  control={control}
                  rules={{
                    minLength: {value: 8, message: 'minimum 8 characters'},
                  }}
                  render={({field: {onChange, onBlur, value}}) => (
                    <Input
                      style={styles.input}
                      inputContainerStyle={styles.inputContainer}
                      onBlur={onBlur}
                      secureTextEntry={isNewPasswordVisible}
                      rightIcon={
                        <TouchableOpacity onPress={toggleNewPasswordVisibility}>
                          <Ionicons
                            name={
                              isNewPasswordVisible
                                ? 'eye-outline'
                                : 'eye-off-outline'
                            }
                            size={25}
                            style={{paddingHorizontal: 10}}
                            color={HexColors['dark-grey']}
                          ></Ionicons>
                        </TouchableOpacity>
                      }
                      value={value}
                      onChangeText={onChange}
                      autoCapitalize="none"
                      errorMessage={errors.new_password?.message}
                      testID="new-password"
                    />
                  )}
                  name="new_password"
                />

                <Button
                  title="Save"
                  buttonStyle={[
                    styles.button,
                    {backgroundColor: HexColors['medium-green'], marginTop: 20},
                  ]}
                  titleStyle={styles.buttonTitle}
                  containerStyle={styles.buttonContainer}
                  onPress={handleSubmit(doEditProfile)}
                  loading={loading}
                  disabled={!isValid || loading}
                  testID="save-button"
                />
              </>
            ),
          },
        ]}
        keyExtractor={(_, index) => `key-${index}`}
        renderItem={({item}) => (
          <Card containerStyle={styles.card}>{item.component}</Card>
        )}
      ></FlatList>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  card: {
    borderRadius: 30,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    marginBottom: 20,
    paddingBottom: 30,
  },
  image: {
    marginVertical: 10,
    height: 200,
    width: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: HexColors['light-grey'],
  },
  buttonTitle: {
    fontFamily: 'InriaSans-Regular',
    fontSize: 14,
  },
  button: {
    backgroundColor: HexColors['almost-white'],
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 15,
    marginBottom: 10,
    marginHorizontal: 10,
    padding: 10,
    // Android shadow
    elevation: 4,
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
  },
  input: {
    padding: 8,
  },
  inputContainer: {
    // iOS shadow
    shadowColor: HexColors['dark-grey'],
    shadowOffset: {
      width: 1,
      height: 1,
    },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    borderRadius: 10,
    backgroundColor: HexColors['white'],
    borderBottomWidth: 0,
    // Android shadow
    elevation: 5,
  },
  instructionsInput: {
    height: 180,
  },
  text: {
    color: HexColors['dark-grey'],
    margin: 10,
    marginBottom: 15,
    fontFamily: 'InriaSans-Regular',
    fontSize: 18,
  },
  ingredientsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addButton: {
    marginHorizontal: 10,
    borderRadius: 30,
    backgroundColor: HexColors['medium-green'],
    padding: 10,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  ingredientContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 10,
    marginBottom: 10,
  },
});

export default EditProfileForm;
