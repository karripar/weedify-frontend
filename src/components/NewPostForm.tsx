import React, {useState, useEffect} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {Button, Card, Chip, Image, Text} from '@rneui/base';
import {Input} from '@rneui/themed';
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
import IngredientSearch from './IngredientSearch';
import NutritionInfo from './NutritionInfo';
import MultiSelect from 'react-native-multiple-select';

// this is for testing
declare global {
  interface Window {
    setTestUnit?: (unit: string) => void;
    testHelpers?: {
      setTestDiets?: (diets: string[]) => void;
      setTestDifficulty?: (level: string) => void;
    };
  }
}

type PostInputs = {
  title: string;
  ingredients: string[];
  dietary_info?: number[];
  instructions: string;
  cooking_time: number;
  portions: number;
  difficulty_level_id: number;
};

interface IngredientItem {
  id: number;
  name: {
    fi: string;
    en?: string;
  };
  energyKcal: number;
  protein: number;
  fat: number;
  carbohydrate: number;
  fiber: number;
  sugar: number;
}

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
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [instructionsLength, setInstructionsLength] = useState(0);
  const [image, setImage] = useState<ImagePicker.ImagePickerResult | null>(
    null,
  );
  const [selectedDifficultyLevel, setSelectedDifficultyLevel] = useState('');
  const [showMockPicker, setShowMockPicker] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<any[]>([]);
  const [recipeTotals, setRecipeTotals] = useState({
    energy: 0,
    protein: 0,
    fat: 0,
    carbohydrate: 0,
    fiber: 0,
    sugar: 0,
  });
  const [selectedIngredientData, setSelectedIngredientData] =
    useState<IngredientItem | null>(null);

  // setting testing values for selector components
  useEffect(() => {
    if (process.env.EXPO_PUBLIC_TEST_MODE === 'true') {
      // add a unit to the ingredient list
      window.setTestUnit = (unit) => {
        setSelectedUnit(unit);
      };
    }
  }, []);

  useEffect(() => {
    if (process.env.EXPO_PUBLIC_TEST_MODE === 'true') {
      window.testHelpers = {
        // set diet types
        setTestDiets: (diets: string[]) => {
          setSelectedDiets(diets);
        },
        // set difficulty level
        setTestDifficulty: (level: string) => {
          setSelectedDifficultyLevel(level);
        },
      };
    }
  }, []);

  // data for the units for now, these will come from db later
  const data = [
    {key: 'g', value: 'g'},
    {key: 'kg', value: 'kg'},
    {key: 'ml', value: 'ml'},
    {key: 'l', value: 'l'},
    {key: 'tsp', value: 'tsp'},
    {key: 'tbsp', value: 'tbsp'},
    {key: 'cup', value: 'cup'},
    {key: 'pcs', value: 'pcs'},
  ];

  // data for difficulty levels
  const difficultyData = [
    {key: '1', value: 'Easy'},
    {key: '2', value: 'Medium'},
    {key: '3', value: 'Hard'},
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
    cooking_time: '' as unknown as number,
    portions: '' as unknown as number,
    difficulty_level_id: Number(),
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
    setSelectedDiets([]);
    setIngredientsList([]);
    setCurrentIngredient('');
    setAmount('');
    setSelectedUnit('');
    setSelectedDifficultyLevel('');
    setInstructionsLength(0);
    reset(initValues);

    // Lisää nämä rivit:
    setSelectedIngredients([]);
    setRecipeTotals({
      energy: 0,
      protein: 0,
      fat: 0,
      carbohydrate: 0,
      fiber: 0,
      sugar: 0,
    });
  };

  // add ingredients with the unit and amout to the post
  const addIngredient = () => {
    if (
      // check that none of the fields are empty
      currentIngredient.trim() !== '' &&
      amount !== '' &&
      selectedUnit !== '' &&
      selectedIngredientData // Make sure we have the nutritional data
    ) {
      const amountInGrams = calculateAmountInGrams(
        parseFloat(amount),
        selectedUnit,
      );
      const factor = amountInGrams / 100;

      const nutritionData = {
        fineli_id: selectedIngredientData.id,
        name: selectedIngredientData.name.fi,
        amount: parseFloat(amount),
        unit: selectedUnit,
        energy_kcal: selectedIngredientData.energyKcal * factor,
        protein: selectedIngredientData.protein * factor,
        fat: selectedIngredientData.fat * factor,
        carbohydrate: selectedIngredientData.carbohydrate * factor,
        fiber: selectedIngredientData.fiber * factor,
        sugar: selectedIngredientData.sugar * factor,
      };

      const ingredient = `${amount} ${selectedUnit} ${currentIngredient.trim()}`;

      setIngredientsList([...ingredientsList, ingredient]);
      setSelectedIngredients([...selectedIngredients, nutritionData]);

      updateRecipeNutrition([...selectedIngredients, nutritionData]);

      setCurrentIngredient('');
      setAmount('');
      setSelectedUnit('');
      setSelectedIngredientData(null);
    }
  };

  // Function to update recipe nutrition totals
  const updateRecipeNutrition = (ingredients: any[]) => {
    const totals = ingredients.reduce(
      (
        acc: {
          energy: number;
          protein: number;
          fat: number;
          carbohydrate: number;
          fiber: number;
          sugar: number;
        },
        ingredient: any,
      ) => {
        return {
          energy: acc.energy + ingredient.energy_kcal,
          protein: acc.protein + ingredient.protein,
          fat: acc.fat + ingredient.fat,
          carbohydrate: acc.carbohydrate + ingredient.carbohydrate,
          fiber: acc.fiber + ingredient.fiber,
          sugar: acc.sugar + ingredient.sugar,
        };
      },
      {
        energy: 0,
        protein: 0,
        fat: 0,
        carbohydrate: 0,
        fiber: 0,
        sugar: 0,
      },
    );

    setRecipeTotals(totals);
  };

  // Helper function to convert measurements to grams for calculation
  const calculateAmountInGrams = (amount: number, unit: string): number => {
    switch (unit.toLowerCase()) {
      case 'g':
        return amount;
      case 'kg':
        return amount * 1000;
      case 'mg':
        return amount / 1000;
      case 'dl':
        return amount * 100; // Approximation for water-based ingredients
      case 'l':
        return amount * 1000; // Approximation for water-based ingredients
      case 'tl':
        return amount * 5; // Approximation
      case 'rkl':
        return amount * 15; // Approximation
      case 'kpl':
        return amount * 100; // Very rough approximation, should be refined
      default:
        return amount;
    }
  };

  // post a new recipe with media
  const doUpload = async (inputs: PostInputs) => {
    // check that all the fields are filled before uploading
    if (!isValid) {
      Alert.alert('Validation Error', 'Please fill out all required fields.');
      return;
    }

    // check that the post has an image or video
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

    // post with the required data
    const recipeData = {
      ...inputs,
      cooking_time: Number(inputs.cooking_time),
      portions: Number(inputs.portions),
      difficulty_level_id: Number(selectedDifficultyLevel),
      // TIEDOSTOTIEDOT MUKAAN
      media_type: fileResponse.data.media_type,
      filename: fileResponse.data.filename,
      filesize: fileResponse.data.filesize,
      ingredients: selectedIngredients.map((ingredient) => ({
        name: ingredient.name,
        amount: Number(ingredient.amount),
        unit: ingredient.unit,
        fineli_id: ingredient.fineli_id,
        energy_kcal: Number((ingredient.energy_kcal || 0.01).toFixed(2)), // Minimiarvo
        protein: Number((ingredient.protein || 0.01).toFixed(2)),
        fat: Number((ingredient.fat || 0.01).toFixed(2)),
        carbohydrate: Number((ingredient.carbohydrate || 0.01).toFixed(2)),
        fiber: Number((ingredient.fiber || 0.01).toFixed(2)),
        sugar: Number((ingredient.sugar || 0.01).toFixed(2)),
      })),
    };

    if (dietTypeIds.length !== 0) {
      recipeData.dietary_info = dietTypeIds;
    } else {
      delete recipeData.dietary_info;
    }

    try {
      // post a new recipe
      const postResponse = await postRecipe(fileResponse, recipeData, token);

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
  const pickImage = async () => {
    // testing the image upload with a mock image (maestro doesn't allow picking media from devices gallery...)
    if (process.env.EXPO_PUBLIC_TEST_MODE === 'true') {
      setShowMockPicker(true);

      // set the mock image data for testing
      setImage({
        canceled: false,
        assets: [
          {
            uri: 'mock-image.jpg',
            width: 500,
            height: 500,
            type: 'image',
          },
        ],
      });
      return;
    }

    // the image picker for the app
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.4,
    });

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

  const handleIngredientSelect = (ingredient: IngredientItem) => {
    setCurrentIngredient(ingredient.name.fi);
    setSelectedIngredientData(ingredient);
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
      {showMockPicker && (
        <View
          testID="mock-image-picker"
          style={{
            position: 'absolute',
            top: 100,
            left: 20,
            right: 20,
            zIndex: 999,
            backgroundColor: HexColors['medium-green'],
            padding: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: 'white',
          }}
        >
          <TouchableOpacity
            testID="mock-image-option"
            style={{
              backgroundColor: HexColors['light-grey'],
              padding: 15,
              borderRadius: 5,
              alignItems: 'center',
              marginVertical: 10,
            }}
            onPress={() => {
              setImage({
                canceled: false,
                assets: [
                  {
                    uri: 'mock-image.jpg',
                    width: 500,
                    height: 500,
                    type: 'image',
                  },
                ],
              });
              setShowMockPicker(false);
            }}
          >
            <Text style={{fontSize: 18, fontWeight: 'bold'}}>Mock Image 1</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView>
        <Card containerStyle={styles.card}>
          {image?.assets && image.assets[0].type === 'video' ? (
            <VideoPlayer videoFile={image.assets[0].uri} style={styles.image} />
          ) : (
            <Image
              testID="image-picker"
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
                testID="title-input"
              />
            )}
            name="title"
          />

          <Text style={styles.text}>Ingredients</Text>
          <IngredientSearch onSelectIngredient={handleIngredientSelect} />

          {selectedIngredientData && (
            <View style={styles.selectedIngredientContainer}>
              <View style={styles.selectedIngredientHeader}>
                <Text style={styles.selectedIngredientTitle}>
                  Selected ingredient
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedIngredientData(null);
                    setCurrentIngredient('');
                  }}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>X</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.selectedIngredientContent}>
                <Text style={styles.selectedIngredientName}>
                  {selectedIngredientData.name.fi}
                </Text>
                <Text style={styles.selectedIngredientDetails}>
                  {selectedIngredientData.energyKcal.toFixed(1)} kcal / 100g |
                  Proteiini: {selectedIngredientData.protein.toFixed(1)}g |
                  Rasva: {selectedIngredientData.fat.toFixed(1)}g |
                  Hiilihydraatit:{' '}
                  {selectedIngredientData.carbohydrate.toFixed(1)}g
                </Text>
              </View>
              <Text style={styles.selectedIngredientGuide}>
                Select amount and unit
              </Text>
            </View>
          )}

          <View style={styles.ingredientsContainer}>
            <View style={{flex: 1.5, marginHorizontal: 10}} testID="unit-input">
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
                testID="amount-input"
              />
            </View>
          </View>
          <Button
            buttonStyle={styles.addButton}
            containerStyle={styles.buttonContainer}
            titleStyle={styles.buttonTitle}
            title="Add"
            testID="add-ingredient-button"
            onPress={addIngredient}
            disabled={
              currentIngredient.trim() === '' ||
              amount === '' ||
              selectedUnit === '' ||
              !selectedIngredientData
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
                  const newIngredientsList = ingredientsList.filter(
                    (_, i) => i !== index,
                  );
                  const newSelectedIngredients = selectedIngredients.filter(
                    (_, i) => i !== index,
                  );

                  setIngredientsList(newIngredientsList);
                  setSelectedIngredients(newSelectedIngredients);

                  updateRecipeNutrition(newSelectedIngredients);
                }}
              />
            ))}
          </View>
          <Text style={[styles.text, {marginTop: 20}]}>
            Select special diets
          </Text>
          <View
            style={{marginHorizontal: 10, marginBottom: 20}}
            testID="diet-input"
          >
            <MultiSelect
              items={dietTypeOptions}
              uniqueKey="value"
              displayKey="value"
              onSelectedItemsChange={(items) => {
                // 5 is the limit for diet types
                if (items.length > 5) {
                  Alert.alert(
                    'Selection limit reached',
                    'You can select a maximum of 5 special diets.',
                    [{text: 'OK'}],
                  );
                  return;
                }
                setSelectedDiets(items);
              }}
              selectedItems={selectedDiets}
              selectText="Select special diets"
              searchInputPlaceholderText="Search diets..."
              tagRemoveIconColor={HexColors['grey']}
              tagTextColor={HexColors['dark-green']}
              tagBorderColor={HexColors['light-green']}
              selectedItemTextColor={HexColors['light-green']}
              selectedItemIconColor={HexColors['light-green']}
              itemTextColor={HexColors['dark-grey']}
              styleRowList={{paddingVertical: 5}}
              styleItemsContainer={{paddingVertical: 10}}
              searchInputStyle={{
                color: HexColors['dark-grey'],
                marginBottom: 20,
                marginTop: 10,
              }}
              styleMainWrapper={{
                overflow: 'hidden',
                borderRadius: 10,
              }}
              submitButtonColor={HexColors['light-green']}
              submitButtonText="Add"
            />
          </View>
          <Text style={[styles.text, {marginTop: 20}]}>Instructions</Text>
          <Controller
            control={control}
            rules={{
              required: true,
              maxLength: {value: 1000, message: 'maximum 1000 characters'},
              minLength: {value: 20, message: 'minimum 20 characters'},
            }}
            render={({field: {onChange, onBlur, value}}) => (
              <>
                <Input
                  style={[styles.input, styles.instructionsInput]}
                  inputContainerStyle={styles.inputContainer}
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    onChange(text);
                    setInstructionsLength(text.length);
                  }}
                  value={value}
                  errorMessage={errors.instructions?.message}
                  multiline={true}
                  numberOfLines={10}
                  textAlignVertical="top"
                  autoCapitalize="sentences"
                  testID="instructions-input"
                />
                <Text style={styles.counterText}>
                  {instructionsLength < 20
                    ? `${instructionsLength}/20 (${20 - instructionsLength} more needed)`
                    : `${instructionsLength}/1000`}
                </Text>
              </>
            )}
            name="instructions"
          />
          <Text style={styles.text}>Estimated cooking time</Text>

          <View style={{flexDirection: 'row', maxWidth: '60%'}}>
            <View style={{flex: 1}}>
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
                    testID="time-input"
                  />
                )}
                name="cooking_time"
              />
            </View>
            <View style={{flex: 1}}>
              <Text style={[styles.text, {marginLeft: 0}]}>min</Text>
            </View>
          </View>
          <Text style={styles.text}>Estimated dish portions</Text>

          <View style={{flexDirection: 'row', maxWidth: '60%'}}>
            <View style={{flex: 1}}>
              <Controller
                control={control}
                rules={{
                  required: {value: true, message: 'Portions is required'},
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
                    errorMessage={errors.portions?.message}
                    testID="portions-input"
                  />
                )}
                name="portions"
              />
            </View>
            <View style={{flex: 1}}>
              <Text
                style={[
                  styles.text,
                  {
                    marginLeft: 0,
                  },
                ]}
              >
                people
              </Text>
            </View>
          </View>
          <Text
            style={[styles.text, {marginTop: 20}]}
            testID="difficulty-input"
          >
            Select difficulty level
          </Text>
          <View>
            <View style={{flex: 1.5, marginHorizontal: 10, marginBottom: 20}}>
              <SelectList
                data={difficultyData}
                search={false}
                setSelected={setSelectedDifficultyLevel}
                save="key"
                defaultOption={{
                  key: selectedDifficultyLevel,
                  value:
                    difficultyData.find(
                      (d) => d.key === selectedDifficultyLevel,
                    )?.value || selectedDifficultyLevel,
                }}
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
                placeholder="Difficulty levels"
              />
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
            disabled={
              !isValid ||
              image === null ||
              loading ||
              selectedDifficultyLevel === ''
            }
            testID="post-button"
          />
          <Button
            title="Reset"
            buttonStyle={styles.button}
            titleStyle={[styles.buttonTitle, {color: HexColors['dark-grey']}]}
            containerStyle={styles.buttonContainer}
            onPress={resetForm}
          />
        </Card>
        {recipeTotals.energy > 0 && (
          <View style={styles.nutritionContainer}>
            <Text style={styles.sectionTitle}>
              Recipe Nutrition (estimated)
            </Text>
            <NutritionInfo
              energy={
                recipeTotals.energy /
                (Number(control._formValues.portions) || 1)
              }
              protein={
                recipeTotals.protein /
                (Number(control._formValues.portions) || 1)
              }
              fat={
                recipeTotals.fat / (Number(control._formValues.portions) || 1)
              }
              carbohydrate={
                recipeTotals.carbohydrate /
                (Number(control._formValues.portions) || 1)
              }
              fiber={
                recipeTotals.fiber / (Number(control._formValues.portions) || 1)
              }
              sugar={
                recipeTotals.sugar / (Number(control._formValues.portions) || 1)
              }
              perPortion={true}
            />
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  card: {
    marginTop: 10,
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
    // Android shadow
    elevation: 4,
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
  },
  counterText: {
    color: HexColors['dark-grey'],
    fontSize: 12,
    textAlign: 'right',
    marginRight: 15,
    marginTop: -10,
    marginBottom: 10,
    fontFamily: 'InriaSans-Regular',
  },
  nutritionContainer: {
    margin: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: HexColors.white,
    borderColor: HexColors['light-grey'],
    borderWidth: 1,
  },
  sectionTitle: {
    fontFamily: 'InriaSans-Regular',
    fontSize: 16,
    marginBottom: 10,
  },

  selectedIngredientContainer: {
    backgroundColor: HexColors['almost-white'],
    borderRadius: 10,
    marginHorizontal: 10,
    marginVertical: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: HexColors['light-green'],
    shadowColor: HexColors['dark-grey'],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedIngredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedIngredientTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: HexColors['dark-green'],
    fontFamily: 'InriaSans-Regular',
  },
  clearButton: {
    backgroundColor: HexColors['light-grey'],
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: HexColors['dark-grey'],
  },
  selectedIngredientContent: {
    marginBottom: 8,
  },
  selectedIngredientName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: HexColors['dark-grey'],
    fontFamily: 'InriaSans-Regular',
  },
  selectedIngredientDetails: {
    fontSize: 12,
    color: HexColors['dark-grey'],
    fontFamily: 'InriaSans-Regular',
  },
  selectedIngredientGuide: {
    fontSize: 12,
    fontStyle: 'italic',
    color: HexColors['medium-green'],
    fontFamily: 'InriaSans-Regular',
  },
});

export default Post;
