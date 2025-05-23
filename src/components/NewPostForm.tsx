import React, {useState, useEffect, useRef} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {Button, Card, Chip, Image, Text, Icon} from '@rneui/base';
import {Input} from '@rneui/themed';
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import VideoPlayer from './VideoPlayer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useDietTypes,
  useFile,
  useRecipes,
  useIngredients,
} from '../hooks/apiHooks';
import {useNavigation} from '@react-navigation/native';
import {NavigatorType} from '../types/LocalTypes';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useUpdateContext} from '../hooks/contextHooks';
import {HexColors} from '../utils/colors';
import {SelectList} from 'react-native-dropdown-select-list';
import {LinearGradient} from 'expo-linear-gradient';
import NutritionInfo from './NutritionInfo';
import debounce from 'lodash/debounce';
import {MultiSelect} from 'react-native-element-dropdown';

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
    en: string;
    fi: string;
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
  const {searchIngredients} = useIngredients();
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
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  const [ingredientSearchResults, setIngredientSearchResults] = useState<any[]>(
    [],
  );

  const debouncedSearch = useRef(
    debounce(async (text: string) => {
      if (text.length >= 2) {
        try {
          const results = await searchIngredients(text);
          setIngredientSearchResults(results);
        } catch (error) {
          console.error('Error searching ingredients:', error);
        }
      } else {
        setIngredientSearchResults([]);
      }
    }, 500),
  ).current;

  // Handle ingredient search with debounce
  const handleIngredientSearch = (text: string) => {
    setIngredientSearchTerm(text);
    debouncedSearch(text);
  };

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

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

  // data for the units
  const data = [
    {key: 'mg', value: 'mg'},
    {key: 'g', value: 'g'},
    {key: 'kg', value: 'kg'},
    {key: 'ml', value: 'ml'},
    {key: 'dl', value: 'dl'},
    {key: 'l', value: 'l'},
    {key: 'tsp', value: 'tsp'},
    {key: 'tbsp', value: 'tbsp'},
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
    getValues,
    trigger,
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
    setIngredientSearchTerm('');
    setIngredientSearchResults([]);
    reset(initValues);

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

  // add ingredients with the unit and amount to the post
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
        name: selectedIngredientData.name.en || selectedIngredientData.name.fi,
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
      setIngredientSearchTerm('');
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

  // Add this helper function from NewPostForm
  const ensureMinNutritionValue = (value: number): number => {
    // Ensure the value is at least 0.01
    return value > 0 ? Number(value.toFixed(2)) : 0.01;
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
        energy_kcal: ensureMinNutritionValue(ingredient.energy_kcal || 0),
        protein: ensureMinNutritionValue(ingredient.protein || 0),
        fat: ensureMinNutritionValue(ingredient.fat || 0),
        carbohydrate: ensureMinNutritionValue(ingredient.carbohydrate || 0),
        fiber: ensureMinNutritionValue(ingredient.fiber || 0),
        sugar: ensureMinNutritionValue(ingredient.sugar || 0),
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
      if (process.env.EXPO_PUBLIC_NODE_ENV === 'development') {
      console.error('Recipe post error:', error);
      };
      Alert.alert('Upload failed', (error as Error).message || 'Unknown error');
    }
  };

  // Handle selecting ingredient from search results
  const selectIngredient = (ingredient: any) => {
    setSelectedIngredientData(ingredient);
    setCurrentIngredient(ingredient.name.en || ingredient.name.fi);
    setIngredientSearchResults([]);
  };

  // select image for the post
  const pickImage = async () => {

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
              <Card containerStyle={styles.card}>
                {image?.assets && image.assets[0].type === 'video' ? (
                  <VideoPlayer
                    videoFile={image.assets[0].uri}
                    style={styles.image}
                  />
                ) : (
                  <Image
                    testID="image-picker"
                    source={{
                      uri:
                        image?.assets![0].uri ||
                        'https://dummyimage.com/600x400/ffffff/112926&text=upload+image/video',
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
                      autoCapitalize="words"
                      errorMessage={errors.title?.message}
                      testID="title-input"
                    />
                  )}
                  name="title"
                />

                <Text style={styles.text}>Ingredients</Text>
                <Input
                  placeholder="Search ingredients..."
                  value={ingredientSearchTerm}
                  onChangeText={handleIngredientSearch}
                  containerStyle={{flex: 1}}
                  rightIcon={
                    ingredientSearchTerm.length > 0 ? (
                      <TouchableOpacity
                        onPress={() => {
                          setIngredientSearchTerm('');
                          setIngredientSearchResults([]);
                        }}
                      >
                        <Icon
                          name="close"
                          type="material"
                          color={HexColors['dark-grey']}
                        />
                      </TouchableOpacity>
                    ) : undefined
                  }
                />
                {ingredientSearchResults.length > 0 && (
                  <View style={styles.searchResultsContainer}>
                    <ScrollView style={{maxHeight: 200}}>
                      {ingredientSearchResults.map((ingredient, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.searchResultItem}
                          onPress={() => selectIngredient(ingredient)}
                        >
                          <Text style={styles.itemName}>
                            {ingredient.name.en || ingredient.name.fi}
                          </Text>
                          <Text style={styles.itemNutrition}>
                            {ingredient.energyKcal.toFixed(1)} kcal |{' '}
                            {ingredient.protein.toFixed(1)}g protein
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

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
                        {selectedIngredientData.name.en ||
                          selectedIngredientData.name.fi}
                        {selectedIngredientData.name.en &&
                          selectedIngredientData.name.fi &&
                          selectedIngredientData.name.en !==
                            selectedIngredientData.name.fi &&
                          ` (${selectedIngredientData.name.fi})`}
                      </Text>
                      <Text style={styles.selectedIngredientDetails}>
                        {selectedIngredientData.energyKcal.toFixed(1)} kcal /
                        100g | Protein:{' '}
                        {selectedIngredientData.protein.toFixed(1)}g | Fat:{' '}
                        {selectedIngredientData.fat.toFixed(1)}g | Carbs:{' '}
                        {selectedIngredientData.carbohydrate.toFixed(1)}g
                      </Text>
                    </View>
                    <Text style={styles.selectedIngredientGuide}>
                      Select amount and unit
                    </Text>
                  </View>
                )}

                <View style={styles.ingredientsContainer}>
                  <View
                    style={{flex: 1.5, marginHorizontal: 10}}
                    testID="unit-input"
                  >
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
                        style: {paddingLeft: 5},
                      }}
                      onPress={() => {
                        const newIngredientsList = ingredientsList.filter(
                          (_, i) => i !== index,
                        );
                        const newSelectedIngredients =
                          selectedIngredients.filter((_, i) => i !== index);

                        setIngredientsList(newIngredientsList);
                        setSelectedIngredients(newSelectedIngredients);

                        updateRecipeNutrition(newSelectedIngredients);
                      }}
                    />
                  ))}
                </View>
                <Text style={[styles.text, {marginTop: 20}]}>Dietary info</Text>
                <View
                  style={{marginHorizontal: 10, marginBottom: 20}}
                  testID="diet-input"
                >
                  <MultiSelect
                    data={dietTypeOptions}
                    onChange={(items: string[]) => {
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
                    value={selectedDiets}
                    labelField="value"
                    valueField="value"
                    placeholder="Special diets"
                    placeholderStyle={{marginBottom: 10, fontWeight: '300'}}
                    searchPlaceholder="Search diets..."
                    selectedStyle={{
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: HexColors['medium-green'],
                      paddingHorizontal: 10,
                    }}
                    itemContainerStyle={{
                      borderRadius: 8,
                    }}
                    containerStyle={{borderRadius: 10}}
                    selectedTextStyle={{color: HexColors['darker-green']}}
                  />
                </View>
                <Text style={[styles.text, {marginTop: 20}]}>Instructions</Text>
                <Controller
                  control={control}
                  rules={{
                    required: true,
                    maxLength: {
                      value: 4000,
                      message: 'maximum 4000 characters',
                    },
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
                        maxLength={4000}
                        textAlignVertical="top"
                        autoCapitalize="sentences"
                        testID="instructions-input"
                      />
                      <Text style={styles.counterText}>
                        {instructionsLength < 20
                          ? `${instructionsLength}/20 (${20 - instructionsLength} more needed)`
                          : `${instructionsLength}/4000`}
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
                        required: {
                          value: true,
                          message: 'Cooking time is required',
                        },
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
                              numericValue === '' ? null : Number(numericValue), // fix type undef
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
                        required: {
                          value: true,
                          message: 'Portions is required',
                        },
                        maxLength: {value: 2, message: 'maximum 2 numbers'},
                        minLength: {value: 1, message: 'minimum 1 numbers'},
                        pattern: {
                          value: /^[0-9]+$/,
                          message: 'Please enter numbers only',
                        },
                        max: {
                          value: 20,
                          message: 'Maximum 20 portions allowed',
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
                              numericValue === '' ? null : Number(numericValue), // fix type undef
                            );

                            if (Number(numericValue) > 20) {
                              trigger('portions');
                            }
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
                  <View
                    style={{flex: 1.5, marginHorizontal: 10, marginBottom: 20}}
                  >
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

                {recipeTotals.energy > 0 && (
                  <View style={styles.nutritionContainer}>
                    <Text style={styles.sectionTitle}>
                      Nutrition Information (estimated)
                    </Text>
                    <NutritionInfo
                      energy={
                        recipeTotals.energy /
                        (Number(getValues('portions')) || 1)
                      }
                      protein={
                        recipeTotals.protein /
                        (Number(getValues('portions')) || 1)
                      }
                      fat={
                        recipeTotals.fat / (Number(getValues('portions')) || 1)
                      }
                      carbohydrate={
                        recipeTotals.carbohydrate /
                        (Number(getValues('portions')) || 1)
                      }
                      fiber={
                        recipeTotals.fiber /
                        (Number(getValues('portions')) || 1)
                      }
                      sugar={
                        recipeTotals.sugar /
                        (Number(getValues('portions')) || 1)
                      }
                      perPortion={true}
                    />
                  </View>
                )}

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
                  titleStyle={[
                    styles.buttonTitle,
                    {color: HexColors['dark-grey']},
                  ]}
                  containerStyle={styles.buttonContainer}
                  onPress={resetForm}
                />
              </Card>
            ),
          },
        ]}
        keyExtractor={(_, index) => `key-${index}`}
        renderItem={({item}) => <View>{item.component}</View>}
      ></FlatList>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  card: {
    marginTop: 5,
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
    marginBottom: 10,
    maxWidth: '95%',
    flex: 1,
  },
  chipButton: {
    backgroundColor: HexColors['light-grey'],
    marginVertical: 5,
    // Android shadow
    elevation: 4,
    marginHorizontal: 10,
    borderRadius: 30,
    padding: 10,
  },
  chipTitle: {
    color: HexColors['dark-grey'],
    fontSize: 12,
    maxWidth: '95%',
    paddingHorizontal: 5,
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
    color: HexColors['dark-green'],
  },

  selectedIngredientContainer: {
    backgroundColor: HexColors['almost-white'],
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 15,
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
  searchResultsContainer: {
    marginHorizontal: 10,
    marginBottom: 15,
    maxHeight: 300,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: HexColors['light-grey'],
    shadowColor: HexColors['dark-grey'],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: HexColors['light-grey'],
  },
  itemName: {
    fontSize: 16,
    color: HexColors['dark-grey'],
    fontWeight: '500',
  },
  itemNutrition: {
    fontSize: 12,
    color: HexColors['medium-green'],
    marginTop: 2,
  },
});

export default Post;
