import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {HexColors} from '../utils/colors';
import {Button, Card, Chip, Image, Input} from '@rneui/base';
import {useDietTypes, useFile, useUser} from '../hooks/apiHooks';
import {NavigationProp, ParamListBase} from '@react-navigation/native';
import {useUpdateContext} from '../hooks/contextHooks';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Controller, useForm} from 'react-hook-form';
import {SelectList} from 'react-native-dropdown-select-list';

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
  const {postExpoFile, loading} = useFile();
  const {updateUser} = useUser();
  const {triggerUpdate} = useUpdateContext();
  const [image, setImage] = useState<ImagePicker.ImagePickerResult | null>(
    null,
  );
  const {getAllDietTypes} = useDietTypes();
  const [dietTypeOptions, setDietTypeOptions] = useState<
    {key: string; value: string}[]
  >([]);
  const [diet, setSelectedDiet] = useState('');
  const [dietList, setDietList] = useState<string[]>([]);

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

  const resetForm = () => {
    setImage(null);
    reset(initValues);
  };

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
          console.log('Diet types not in expected format:', allDietTypes);
          setDietTypeOptions([]);
        }
      } catch (error) {
        console.error('Error fetching diet types:', error);
      }
    };
    fetchDietTypes();
  }, []);

  const addDiet = () => {
    if (!dietList.includes(diet)) {
      const dietType = diet;

      setDietList([...dietList, dietType]);
    }
    setSelectedDiet('');
  };

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
    if (!token) {
      Alert.alert('Error', 'No token found, please login.');
      return;
    }

    // new profile image
    if (image && image.assets) {
      const fileResponse = await postExpoFile(image.assets[0].uri, token);
      if (!fileResponse) {
        Alert.alert('Upload failed');
        return;
      }

      console.log('file response', fileResponse);

      // get diet type ids from the selected names
      const dietTypeIds = dietList.map((dietName) => {
        // find the id that corresponds to the selected diet name
        const dietType = dietTypeOptions.find((opt) => opt.value === dietName);
        return dietType ? dietType.key : '1';
      });

      try {
        // update user
        const editResponse = await updateUser(token, fileResponse, {
          ...inputs,
          diet_type: dietTypeIds,
        });

        console.log('payload', editResponse);

        // Success handling
        reset(initValues);
        triggerUpdate();
        Alert.alert('Update successful', editResponse.message);
        navigation.navigate('Profile');
      } catch (error) {
        console.error('User update error:', error);
        Alert.alert(
          'Update failed',
          (error as Error).message || 'Unknown error',
        );
      }
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      resetForm();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return (
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
            />
          )}
          name="bio"
        />

        <Text style={[styles.text, {marginTop: 20}]}>Diet restrictions</Text>
        <View style={{flexDirection: 'row', marginBottom: 10}}>
          <View style={{flex: 5}}>
            <SelectList
              data={dietTypeOptions}
              setSelected={setSelectedDiet}
              defaultOption={{key: diet, value: diet}}
              save="value"
              boxStyles={{
                borderColor: HexColors['light-grey'],
                borderWidth: 1.5,
                marginHorizontal: 10,
              }}
              dropdownStyles={{
                borderColor: HexColors['light-grey'],
                borderWidth: 1.5,
                marginBottom: 10,
                marginHorizontal: 10,
              }}
              dropdownItemStyles={{marginVertical: 3}}
              placeholder="Diets"
            ></SelectList>
          </View>
          <View style={{flex: 2}}>
            <Button
              buttonStyle={styles.addButton}
              containerStyle={styles.buttonContainer}
              titleStyle={styles.buttonTitle}
              title="Add"
              onPress={addDiet}
              disabled={diet === ''}
            >
              Add
            </Button>
          </View>
        </View>
        <View style={styles.ingredientContainer}>
          {dietList.map((diet, index) => (
            <Chip
              key={index}
              title={diet}
              buttonStyle={styles.chipButton}
              titleStyle={styles.chipTitle}
              containerStyle={styles.chipContainer}
              onPress={() => {
                // remove diet type when pressed
                setDietList(dietList.filter((_, i) => i !== index));
              }}
            />
          ))}
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
        <Button
          title="Reset"
          buttonStyle={styles.button}
          titleStyle={[styles.buttonTitle, {color: HexColors['dark-grey']}]}
          containerStyle={styles.buttonContainer}
          onPress={resetForm}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
