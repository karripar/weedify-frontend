import {Controller, useForm} from 'react-hook-form';
import {Button, Card, Chip, Image, Text} from '@rneui/base';
import {Input} from '@rneui/themed';
import {Alert, ScrollView, StyleSheet, View} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {useEffect, useState} from 'react';
import VideoPlayer from './VideoPlayer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDietTypes, useFile, useRecipes} from '../hooks/apiHooks';
import {useNavigation} from '@react-navigation/native';
import {NavigatorType} from '../types/LocalTypes';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useUpdateContext} from '../hooks/contextHooks';
import {HexColors} from '../utils/colors';
import {SelectList} from 'react-native-dropdown-select-list';
import {LinearGradient} from 'expo-linear-gradient';

type PostInputs = {
  title: string;
  ingredients: string[];
  instructions: string;
  cooking_time: number;
  diet_type: string;
};

//
const Post = () => {
  const {postExpoFile, loading} = useFile();
  const {postRecipe} = useRecipes();
  const navigation = useNavigation<NativeStackNavigationProp<NavigatorType>>();
  const {triggerUpdate} = useUpdateContext();
  const [selectedUnit, setSelectedUnit] = useState('');
  const [amount, setAmount] = useState('');
  const [ingredientsList, setIngredientsList] = useState<string[]>([]);

  const {getAllDietTypes} = useDietTypes();
  const [dietTypeOptions, setDietTypeOptions] = useState<
    {key: string; value: string}[]
  >([]);
  const [dietList, setDietList] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerResult | null>(
    null,
  );
  const [resetKey, setResetKey] = useState(0);

  // data for the units for now, these will come from db later
  const data = [
    {key: 'g', value: 'g'},
    {key: 'mg', value: 'mg'},
    {key: 'tl', value: 'tl'},
    {key: 'rkl', value: 'rkl'},
    {key: 'dl', value: 'dl'},
    {key: 'l', value: 'l'},
    {key: 'kpl', value: 'kpl'},
  ];

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

  // set init values for the post form
  const initValues: PostInputs = {
    title: '',
    ingredients: [],
    instructions: '',
    cooking_time: Number(),
    diet_type: '',
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
    setIngredientsList([]);
    setCurrentIngredient('');
    setAmount('');
    setSelectedUnit('');
    reset(initValues);
  };

  // add ingredients with the unit and amout to the post
  const addIngredient = () => {
    if (
      // check that none of the fields are empty
      currentIngredient.trim() !== '' &&
      amount !== '' &&
      selectedUnit !== ''
    ) {
      // create the ingredient with the unit and amount
      const ingredient = `${amount} ${selectedUnit} ${currentIngredient.trim()}`;

      setIngredientsList([...ingredientsList, ingredient]);

      // clear the input and selector fields
      setCurrentIngredient('');
      setAmount('');
      setSelectedUnit('');
    }
  };

  // post a new recipe with media
  const doUpload = async (inputs: PostInputs) => {
    if (!image || !image.assets) {
      Alert.alert('Please choose a file.');
      return;
    }

    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('Error', 'No token found, please login.');
      return;
    }

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
      // post a new recipe
      const postResponse = await postRecipe(
        fileResponse,
        {
          ...inputs,
          cooking_time: Number(inputs.cooking_time),
          ingredients: ingredientsList,
          diet_type: dietTypeIds,
          difficulty_level_id: 1,
        },
        token,
      );

      // Success handling
      resetForm();
      triggerUpdate();
      Alert.alert('Upload successful', postResponse.message);
      navigation.navigate('Home');
    } catch (error) {
      console.error('Recipe post error:', error);
      Alert.alert('Upload failed', (error as Error).message || 'Unknown error');
    }
  };

  // select image for the post
  // TODO: why this doesn't display the selected image?
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.4,
    });

    console.log(result);

    if (!result.canceled) {
      setImage(result);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      resetForm();
    });
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
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <Card containerStyle={styles.card}>
          {image?.assets && image.assets[0].type === 'video' ? (
            <VideoPlayer videoFile={image.assets[0].uri} style={styles.image} />
          ) : (
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
          )}
          <Text style={styles.text}>Title</Text>
          <Controller
            control={control}
            rules={{
              required: {value: true, message: 'is required'},
              maxLength: {value: 25, message: 'maximum 25 characters'},
              minLength: {value: 3, message: 'minimum 3 characters'},
            }}
            render={({field: {onChange, onBlur, value}}) => (
              <Input
                style={styles.input}
                inputContainerStyle={styles.inputContainer}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="sentences"
                errorMessage={errors.title?.message}
              />
            )}
            name="title"
          />

          <Text style={styles.text}>Ingredients</Text>
          <Input
            style={styles.input}
            inputContainerStyle={styles.inputContainer}
            value={currentIngredient}
            onChangeText={setCurrentIngredient}
            autoCapitalize="sentences"
            placeholder="Ingredient"
          />
          <View style={styles.ingredientsContainer}>
            <View style={{flex: 1.5, marginHorizontal: 10}}>
              <SelectList
                data={data}
                search={false}
                setSelected={setSelectedUnit}
                save="value"
                defaultOption={{key: selectedUnit, value: selectedUnit}}
                boxStyles={{
                  borderColor: HexColors['light-grey'],
                  borderWidth: 1.5,
                }}
                dropdownStyles={{
                  borderColor: HexColors['light-grey'],
                  borderWidth: 1.5,
                  marginBottom: 10,
                }}
                dropdownItemStyles={{marginVertical: 3}}
                placeholder="Unit"
              />
            </View>
            <View style={{flex: 1}}>
              <Input
                style={styles.input}
                inputContainerStyle={styles.inputContainer}
                value={amount}
                onChangeText={setAmount}
                autoCapitalize="none"
                placeholder="Amount"
              />
            </View>
          </View>
          <Button
            buttonStyle={styles.addButton}
            containerStyle={styles.buttonContainer}
            titleStyle={styles.buttonTitle}
            title="Add"
            onPress={addIngredient}
            disabled={
              currentIngredient.trim() === '' ||
              amount === '' ||
              selectedUnit === ''
            }
          >
            Add
          </Button>

          <View style={styles.ingredientContainer}>
            {ingredientsList.map((ingredient, index) => (
              <Chip
                key={index}
                title={ingredient}
                buttonStyle={styles.chipButton}
                titleStyle={[styles.chipTitle, {paddingLeft: 0}]}
                containerStyle={styles.chipContainer}
                icon={{
                  name: 'close',
                  type: 'ionicon',
                  size: 16,
                  color: HexColors['dark-grey'],
                }}
                onPress={() => {
                  // remove ingredient when pressed
                  setIngredientsList(
                    ingredientsList.filter((_, i) => i !== index),
                  );
                }}
              />
            ))}
          </View>
          <Text style={[styles.text, {marginTop: 20}]}>
            Select special diets
          </Text>
          <View style={{flex: 5}}>
            <SelectList
              key={`diet-selector-${resetKey}`}
              data={dietTypeOptions}
              setSelected={(diettype: string) => {
                const isDuplicate = dietList.some(
                  (existing) =>
                    existing.toLowerCase() === diettype.toLowerCase(),
                );

                if (diettype && !isDuplicate) {
                  setDietList([...dietList, diettype]);
                }
                setResetKey((prev) => prev + 1);
              }}
              save="value"
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
              }}
              dropdownItemStyles={{marginVertical: 3}}
              placeholder="Diets"
            ></SelectList>
          </View>
          <View style={styles.ingredientContainer}>
            {dietList.map((diet, index) => (
              <Chip
                key={index}
                title={diet}
                buttonStyle={styles.chipButton}
                titleStyle={styles.chipTitle}
                containerStyle={styles.chipContainer}
                icon={{
                  name: 'close',
                  type: 'ionicon',
                  size: 16,
                  color: HexColors['dark-grey'],
                }}
                iconRight
                onPress={() => {
                  // remove diet type when pressed
                  setDietList(dietList.filter((_, i) => i !== index));
                }}
              />
            ))}
          </View>

          <Text style={[styles.text, {marginTop: 20}]}>Instructions</Text>
          <Controller
            control={control}
            rules={{
              required: true,
              maxLength: {value: 1000, message: 'maximum 1000 characters'},
              minLength: {value: 2, message: 'minimum 20 characters'},
            }}
            render={({field: {onChange, onBlur, value}}) => (
              <Input
                style={[styles.input, styles.instructionsInput]}
                inputContainerStyle={styles.inputContainer}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                errorMessage={errors.instructions?.message}
                multiline={true}
                numberOfLines={10}
                textAlignVertical="top"
                autoCapitalize="sentences"
              />
            )}
            name="instructions"
          />
          <Text style={styles.text}>Estimated cooking time</Text>

          <View style={{flexDirection: 'row', maxWidth: '60%'}}>
            <View style={{flex: 2}}>
              <Controller
                control={control}
                rules={{
                  required: {value: true, message: 'Cooking time is required'},
                  maxLength: {value: 10, message: 'maximum 10 numbers'},
                  minLength: {value: 1, message: 'minimum 1 numbers'},
                  pattern: {
                    value: /^[0-9]+$/,
                    message: 'Please enter numbers only',
                  },
                }}
                render={({field: {onChange, onBlur, value}}) => (
                  <Input
                    style={styles.input}
                    inputContainerStyle={styles.inputContainer}
                    onBlur={onBlur}
                    onChangeText={(text) => {
                      const numericValue = text.replace(/[^0-9]/g, '');
                      onChange(
                        numericValue === '' ? undefined : Number(numericValue),
                      );
                    }}
                    value={value?.toString()}
                    keyboardType="numeric"
                    autoCapitalize="none"
                    errorMessage={errors.cooking_time?.message}
                  />
                )}
                name="cooking_time"
              />
            </View>
            <View style={{flex: 1}}>
              <Text
                style={[
                  styles.text,
                  {
                    margin: 0,
                    borderWidth: 1.5,
                    borderRadius: 10,
                    padding: 8,
                    color: HexColors['dark-grey'],
                    borderColor: HexColors['light-grey'],
                  },
                ]}
              >
                min
              </Text>
            </View>
          </View>
          <Button
            title="Post"
            buttonStyle={[
              styles.button,
              {backgroundColor: HexColors['medium-green']},
            ]}
            titleStyle={styles.buttonTitle}
            containerStyle={styles.buttonContainer}
            onPress={handleSubmit(doUpload)}
            loading={loading}
            disabled={!isValid || image === null || loading}
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  card: {
    borderRadius: 10,
    marginBottom: 10,
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
    paddingLeft: 10,
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

export default Post;
