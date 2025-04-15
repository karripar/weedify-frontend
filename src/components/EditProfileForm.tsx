import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {HexColors} from '../utils/colors';
import {Button, Card, Chip, Image, Input} from '@rneui/base';
import {useDietTypes, useFile, useUser} from '../hooks/apiHooks';
import {NavigationProp, ParamListBase} from '@react-navigation/native';
import {useUpdateContext, useUserContext} from '../hooks/contextHooks';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Controller, useForm} from 'react-hook-form';
import {MultipleSelectList} from 'react-native-dropdown-select-list';
import {LinearGradient} from 'expo-linear-gradient';

type UpdateInputs = {
  username: string;
  email: string;
  bio: string;
  dietary_info: string;
};

const EditProfileForm = ({
  navigation,
}: {
  navigation: NavigationProp<ParamListBase>;
}) => {
  const {user} = useUserContext();
  const {postProfileImageFile, loading} = useFile();
  const {updateUser, getUserDietaryRestrictions, getUserByToken} = useUser();
  const {triggerUpdate} = useUpdateContext();
  const [image, setImage] = useState<ImagePicker.ImagePickerResult | null>(
    null,
  );
  const {getAllDietTypes} = useDietTypes();
  const [dietTypeOptions, setDietTypeOptions] = useState<
    {key: string; value: string}[]
  >([]);
  const [dietList, setDietList] = useState<string[]>([]);
  const [dietResetKey, setDietResetKey] = useState(0);
  const [dietTypesLoaded, setDietTypesLoaded] = useState(false);

  const initValues: UpdateInputs = {
    username: '',
    email: '',
    bio: '',
    dietary_info: '',
  };
  const {
    control,
    handleSubmit,
    formState: {errors, isValid},
    reset,
  } = useForm({
    defaultValues: initValues,
  });

  // clear all the inputs fields and selected ingredients and dietypes
  const resetForm = () => {
    setImage(null);
    setDietList([]);
    setDietResetKey((prev) => prev + 1);
    reset(initValues);
  };

  useEffect(() => {
    const loadUserDietaryInfo = async () => {
      if (user && dietTypesLoaded && dietTypeOptions.length > 0) {
        try {
          const dietaryIds = await getUserDietaryRestrictions(user.user_id);
          console.log('Fetched dietary IDs:', dietaryIds);

          if (dietaryIds && dietaryIds.length > 0) {
            const userDiets = dietaryIds
              .map((id: string) => {
                const diet = dietTypeOptions.find((d) => d.key === id);
                return diet ? diet.value : '';
              })
              .filter(Boolean);

            console.log('Setting diet list from API:', userDiets);
            setDietList(userDiets);
          }
        } catch (error) {
          console.error('Error loading dietary restrictions:', error);
        }
      }
    };

    loadUserDietaryInfo();
  }, [user, dietTypesLoaded, dietTypeOptions]);

  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        email: user.email,
        bio: user.bio || '',
        dietary_info: user.dietary_info || '',
      });

      console.log('User dietary info:', user.dietary_info);
    }
  }, [user, dietTypeOptions]);

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
          setDietTypesLoaded(true);
        } else {
          console.log('Diet types not in expected format:', allDietTypes);
          setDietTypeOptions([]);
        }
      } catch (error) {
        console.error('Error fetching diet types:', error);
      }
    };
    fetchDietTypes();
  }, []);

  // select image for the post
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.4,
    });

    console.log(result);

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

    // Create update object with fields to update
    const updateData: Record<string, string | string[] | null> = {};

    // Only add non-empty fields with proper validation
    if (inputs.username && inputs.username.trim().length >= 3) {
      updateData.username = inputs.username;
    }

    if (inputs.email && inputs.email.includes('@')) {
      updateData.email = inputs.email;
    }

    if (inputs.bio !== undefined) {
      updateData.bio = inputs.bio.trim() || null; // Allow empty bio
    }

    // get diet type ids from the selected names
    const dietTypeIds = dietList.map((dietName) => {
      // find the id that corresponds to the selected diet name
      const dietType = dietTypeOptions.find((opt) => opt.value === dietName);
      return dietType ? dietType.key : '1';
    });

    // add dietary info if not empty
    if (dietTypeIds.length > 0) {
      updateData.dietary_info = dietTypeIds.join(', ');
    }

    // handle profile image (both with and without new image)
    let fileResponse;
    if (image && image.assets) {
      fileResponse = await postProfileImageFile(image.assets[0].uri, token);
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

      console.log('Sending update data:', JSON.stringify(editResponse));

      resetForm();
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
      <ScrollView>
        <Card containerStyle={styles.card}>
          <Image
            source={{
              uri:
                image?.assets![0].uri ||
                process.env.EXPO_PUBLIC_UPLOADS + '/uploadimage.png',
            }}
            style={[
              styles.image,
              {
                objectFit: image?.assets?.[0].uri ? 'cover' : 'contain',
              },
            ]}
            onPress={pickImage}
          />
          <Text style={styles.text}>Username</Text>

          <Controller
            control={control}
            rules={{
              maxLength: {value: 20, message: 'maximum 25 characters'},
              minLength: {value: 3, message: 'minimum 3 characters'},
            }}
            render={({field: {onChange, onBlur, value}}) => (
              <Input
                style={styles.input}
                inputContainerStyle={styles.inputContainer}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="none"
                errorMessage={errors.username?.message}
              />
            )}
            name="username"
          />

          <Text style={styles.text}>Email</Text>
          <Controller
            control={control}
            rules={{
              maxLength: {value: 50, message: 'maximum 50 characters'},
              minLength: {value: 3, message: 'minimum 3 characters'},
            }}
            render={({field: {onChange, onBlur, value}}) => (
              <Input
                style={styles.input}
                inputContainerStyle={styles.inputContainer}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="none"
                errorMessage={errors.email?.message}
              />
            )}
            name="email"
          />

          <Text style={styles.text}>Bio</Text>
          <Controller
            control={control}
            rules={{
              maxLength: {value: 200, message: 'maximum 200 characters'},
              minLength: {value: 3, message: 'minimum 3 characters'},
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
                numberOfLines={10}
                textAlignVertical="top"
                testID="bio-input"
              />
            )}
            name="bio"
          />

          <Text style={[styles.text, {marginTop: 20}]}>Diet restrictions</Text>
          <View style={{flex: 5}}>
            <MultipleSelectList
              key={`diet-selector-${dietResetKey}`}
              setSelected={(val: string[]) => {
                setDietList(val);
              }}
              data={dietTypeOptions}
              save="value"
              onSelect={() => {
                console.log('Selected items: ', dietList);
              }}
              label="Selected Diets"
              boxStyles={{
                borderColor: HexColors['light-grey'],
                borderWidth: 1.5,
                margin: 10,
              }}
              dropdownStyles={{
                borderColor: HexColors['light-grey'],
                borderWidth: 1.5,
                marginBottom: 10,
                marginHorizontal: 10,
                maxHeight: 200,
              }}
              dropdownItemStyles={{marginVertical: 3}}
              badgeStyles={{backgroundColor: HexColors['light-green']}}
              placeholder="Diets"
            />
          </View>
          <Button
            title="Save"
            buttonStyle={[
              styles.button,
              {backgroundColor: HexColors['medium-green']},
            ]}
            titleStyle={styles.buttonTitle}
            containerStyle={styles.buttonContainer}
            onPress={handleSubmit(doEditProfile)}
            loading={loading}
            disabled={!isValid || loading}
          />
        </Card>
      </ScrollView>
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
    height: 200,
    margin: 10,
    borderRadius: 10,
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
    backgroundColor: HexColors.white,
    fontWeight: '200',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: HexColors['light-grey'],
  },
  inputContainer: {
    borderBottomWidth: 0,
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
  chipButton: {
    backgroundColor: HexColors['light-grey'],
    marginRight: 10,
    marginVertical: 5,
  },
  chipTitle: {
    color: HexColors['dark-grey'],
    fontSize: 12,
  },
  chipContainer: {
    borderRadius: 20,
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
});

export default EditProfileForm;
