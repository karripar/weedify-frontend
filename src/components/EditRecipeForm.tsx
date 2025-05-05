import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  ScrollView,
} from 'react-native';
import React, {useEffect, useState, useRef} from 'react';
import {HexColors} from '../utils/colors';
import {Button, Card, Input, ListItem, Icon} from '@rneui/base';
import {MultiSelect} from 'react-native-element-dropdown';
import {useDietTypes, useRecipes, useIngredients} from '../hooks/apiHooks';
import {NavigationProp, ParamListBase} from '@react-navigation/native';
import {useUpdateContext, useUserContext} from '../hooks/contextHooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Controller, useForm} from 'react-hook-form';
import {LinearGradient} from 'expo-linear-gradient';
import {SelectList} from 'react-native-dropdown-select-list';
import {EditRecipeInputs} from '../types/LocalTypes';
import NutritionInfo from '../components/NutritionInfo';
import debounce from 'lodash/debounce';

const ensureMinNutritionValue = (value: number): number => {
  // Ensure the value is at least 0.01
  return value > 0 ? Number(value.toFixed(2)) : 0.01;
};

const EditRecipeForm = ({
  navigation,
  route,
}: {
  navigation: NavigationProp<ParamListBase>;
  route: any;
}) => {
  const {user} = useUserContext();
  const {updateRecipe, loading} = useRecipes();
  const {triggerUpdate} = useUpdateContext();
  const {getAllDietTypes} = useDietTypes();
  const {searchIngredients} = useIngredients();

  // get the recipe data
  const recipe = route.params.item;

  // set the diet type options
  const [dietTypeOptions, setDietTypeOptions] = useState<
    {key: string; value: string}[]
  >([]);

  const [ingredients, setIngredients] = useState<
    {
      name: string;
      amount: string;
      unit: string;
      fineli_id?: number;
      energy_kcal?: number;
      protein?: number;
      fat?: number;
      carbohydrate?: number;
      fiber?: number;
      sugar?: number;
    }[]
  >([]);

  const [instructionsLength, setInstructionsLength] = useState(
    recipe.instructions.length,
  );

  // set the existing recipe data
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedDifficultyLevel, setSelectedDifficultyLevel] = useState(() => {
    if (recipe.difficulty_level === 'Easy') return '1';
    if (recipe.difficulty_level === 'Medium') return '2';
    if (recipe.difficulty_level === 'Hard') return '3';
    return '1';
  });

  const [selectedIngredientData, setSelectedIngredientData] =
    useState<any>(null);
  const [ingredientSearchResults, setIngredientSearchResults] = useState<any[]>(
    [],
  );
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  const [recipeTotals, setRecipeTotals] = useState({
    energy: 0,
    protein: 0,
    fat: 0,
    carbohydrate: 0,
    fiber: 0,
    sugar: 0,
  });

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

  // data for the unit selector
  const unitData = [
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

  // data for difficulty level selector
  const difficultyData = [
    {key: '1', value: 'Easy'},
    {key: '2', value: 'Medium'},
    {key: '3', value: 'Hard'},
  ];

  // set the edit recipe form with the recipe data
  const {
    control,
    handleSubmit,
    getValues,
    formState: {errors, isValid},
  } = useForm<EditRecipeInputs>({
    defaultValues: {
      title: recipe.title,
      instructions: recipe.instructions,
      cooking_time: recipe.cooking_time,
      portions: recipe.portions,
      difficulty_level: recipe.difficulty_level,
    },
  });

  // Use debounced search
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

  const selectIngredient = (ingredient: any) => {
    setSelectedIngredientData(ingredient);
    setCurrentIngredient(ingredient.name.en);
    setIngredientSearchResults([]);
  };

  const calculateAmountInGrams = (amount: number, unit: string): number => {
    switch (unit.toLowerCase()) {
      case 'g':
        return amount;
      case 'kg':
        return amount * 1000;
      case 'mg':
        return amount / 1000;
      case 'dl':
        return amount * 100; // Approx for water-based
      case 'l':
        return amount * 1000;
      case 'tl':
        return amount * 5; // Approx
      case 'rkl':
        return amount * 15; // Approx
      case 'kpl':
        return amount * 100; // Very rough estimate
      default:
        return amount;
    }
  };

  const updateRecipeNutrition = (ingredients: any[]) => {
    const totals = ingredients.reduce(
      (acc, ingredient) => {
        if (!ingredient.energy_kcal) return acc;

        return {
          energy: acc.energy + (ingredient.energy_kcal || 0),
          protein: acc.protein + (ingredient.protein || 0),
          fat: acc.fat + (ingredient.fat || 0),
          carbohydrate: acc.carbohydrate + (ingredient.carbohydrate || 0),
          fiber: acc.fiber + (ingredient.fiber || 0),
          sugar: acc.sugar + (ingredient.sugar || 0),
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

  // get the dietypes
  useEffect(() => {
    const fetchDietTypes = async () => {
      try {
        const allDietTypes = await getAllDietTypes();
        if (Array.isArray(allDietTypes)) {
          const dietTypes = allDietTypes.map((dietType) => ({
            key: dietType.diet_type_id.toString(),
            value: dietType.diet_type_name,
          }));
          setDietTypeOptions(dietTypes);
        }
      } catch (error) {
        console.error('Error fetching diet types:', error);
      }
    };
    fetchDietTypes();
  }, []);

  useEffect(() => {
    if (recipe) {
      const recipeIngredients = Array.isArray(recipe.ingredients)
        ? recipe.ingredients
        : typeof recipe.ingredients === 'string'
          ? JSON.parse(recipe.ingredients)
          : [];

      // format the ingredients
      const formattedIngredients = recipeIngredients.map((ing: any) => ({
        name: ing.name,
        amount: ing.amount.toString(),
        unit: ing.unit,
        fineli_id: ing.fineli_id,
        energy_kcal: ing.energy_kcal,
        protein: ing.protein,
        fat: ing.fat,
        carbohydrate: ing.carbohydrate,
        fiber: ing.fiber,
        sugar: ing.sugar,
      }));
      setIngredients(formattedIngredients);
      updateRecipeNutrition(formattedIngredients);

      const recipeDietTypes = Array.isArray(recipe.diet_types)
        ? recipe.diet_types
        : typeof recipe.diet_types === 'string'
          ? JSON.parse(recipe.diet_types)
          : [];

      // get the corresponding diet type names from the fetched diet ids
      if (dietTypeOptions.length > 0) {
        const dietNames = recipeDietTypes
          .map((diet: any) => {
            const option = dietTypeOptions.find(
              (opt) => opt.key === diet.diet_type_id?.toString(),
            );
            return option ? option.value : '';
          })
          .filter(Boolean);

        setSelectedDiets(dietNames);
      }
    }
  }, [recipe, dietTypeOptions]);

  // add an ingredient to the recipe
  const addIngredient = () => {
    if (
      currentIngredient.trim() !== '' &&
      amount !== '' &&
      selectedUnit !== ''
    ) {
      let newIngredient: {
        name: string;
        amount: string;
        unit: string;
        fineli_id?: number;
        energy_kcal?: number;
        protein?: number;
        fat?: number;
        carbohydrate?: number;
        fiber?: number;
        sugar?: number;
      } = {
        name: currentIngredient.trim(),
        amount: amount,
        unit: selectedUnit,
      };

      if (selectedIngredientData) {
        const amountInGrams = calculateAmountInGrams(
          parseFloat(amount),
          selectedUnit,
        );
        const factor = amountInGrams / 100;

        newIngredient = {
          ...newIngredient,
          fineli_id: selectedIngredientData.id,
          energy_kcal: ensureMinNutritionValue(
            selectedIngredientData.energyKcal * factor,
          ),
          protein: ensureMinNutritionValue(
            selectedIngredientData.protein * factor,
          ),
          fat: ensureMinNutritionValue(selectedIngredientData.fat * factor),
          carbohydrate: ensureMinNutritionValue(
            selectedIngredientData.carbohydrate * factor,
          ),
          fiber: ensureMinNutritionValue(selectedIngredientData.fiber * factor),
          sugar: ensureMinNutritionValue(selectedIngredientData.sugar * factor),
        };
      }

      const newIngredients = [...ingredients, newIngredient];
      setIngredients(newIngredients);
      updateRecipeNutrition(newIngredients);

      setCurrentIngredient('');
      setAmount('');
      setSelectedUnit('');
      setSelectedIngredientData(null);
    }
  };

  // remove an ingredient
  const removeIngredient = (index: number) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
    updateRecipeNutrition(newIngredients);
  };

  // edit recipe with the updated data
  const doEditRecipe = async (inputs: EditRecipeInputs) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !user) {
        Alert.alert('Error', 'Please log in and try again.');
        return;
      }

      // only user who owns the recipe can edit (TODO: admin needs to be added)
      if (user.user_id !== recipe.user_id && user.user_level_id !== 1) {
        Alert.alert('Error', 'You can only edit your own recipes.');
        return;
      }

      const updateData: any = {
        title: inputs.title,
        instructions: inputs.instructions,
        cooking_time: inputs.cooking_time ? parseInt(inputs.cooking_time) : 0,
        portions: inputs.portions ? parseInt(inputs.portions) : 0,
        difficulty_level_id: parseInt(selectedDifficultyLevel),
      };

      // Add nutrition information for the entire recipe
      updateData.nutrition = {
        energy_kcal: ensureMinNutritionValue(
          recipeTotals.energy / Number(inputs.portions || 1),
        ),
        protein: ensureMinNutritionValue(
          recipeTotals.protein / Number(inputs.portions || 1),
        ),
        fat: ensureMinNutritionValue(
          recipeTotals.fat / Number(inputs.portions || 1),
        ),
        carbohydrate: ensureMinNutritionValue(
          recipeTotals.carbohydrate / Number(inputs.portions || 1),
        ),
        fiber: ensureMinNutritionValue(
          recipeTotals.fiber / Number(inputs.portions || 1),
        ),
        sugar: ensureMinNutritionValue(
          recipeTotals.sugar / Number(inputs.portions || 1),
        ),
      };

      updateData.ingredients = ingredients.map((ing) => {
        const baseIngredient = {
          name: ing.name,
          amount: parseFloat(ing.amount),
          unit: ing.unit,
        };

        if ('energy_kcal' in ing) {
          return {
            ...baseIngredient,
            fineli_id: ing.fineli_id || 0,
            energy_kcal: ing.energy_kcal || 0,
            protein: ing.protein || 0,
            fat: ing.fat || 0,
            carbohydrate: ing.carbohydrate || 0,
            fiber: ing.fiber || 0,
            sugar: ing.sugar || 0,
          };
        }

        return baseIngredient;
      });

      if (selectedDiets.length > 0) {
        const dietTypeIds = selectedDiets
          .map((dietName) => {
            const dietOption = dietTypeOptions.find(
              (option) => option.value === dietName,
            );
            return dietOption ? Number(dietOption.key) : null;
          })
          .filter((id) => id !== null);

        updateData.dietary_info = dietTypeIds;
      }

      const response = await updateRecipe(token, recipe.recipe_id, updateData);

      console.log(updateData.ingredients);

      if (response) {
        Alert.alert('Success', 'Recipe updated successfully');
        triggerUpdate();
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
      Alert.alert(
        'Error',
        'Failed to update recipe: ' + (error as Error).message,
      );
    }
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
      <FlatList
        data={[
          {
            component: (
              <>
                <Text style={styles.text}>Title</Text>
                <Controller
                  control={control}
                  rules={{
                    required: {value: true, message: 'Title is required'},
                    minLength: {value: 3, message: 'Minimum 3 characters'},
                    maxLength: {value: 100, message: 'Maximum 100 characters'},
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
                            {ingredient.name.en}
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
                        Selected Ingredient
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
                        {selectedIngredientData.name.en}
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

                <Input
                  style={styles.input}
                  inputContainerStyle={styles.inputContainer}
                  value={currentIngredient}
                  onChangeText={setCurrentIngredient}
                  autoCapitalize="sentences"
                  placeholder="Ingredient"
                  testID="ingredient-input"
                />

                <View style={styles.ingredientsContainer}>
                  <View
                    style={{flex: 1.5, marginHorizontal: 10}}
                    testID="unit-input"
                  >
                    <SelectList
                      data={unitData}
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
                <View style={{flex: 1, justifyContent: 'center'}}>
                  <Button
                    titleStyle={styles.buttonTitle}
                    title="Add"
                    disabled={
                      currentIngredient.trim() === '' ||
                      amount === '' ||
                      selectedUnit === ''
                    }
                    buttonStyle={styles.addButton}
                    onPress={addIngredient}
                    testID="add-ingredient-button"
                  />
                </View>

                <View style={styles.ingredientContainer}>
                  {ingredients.map((ingredient, index) => (
                    <ListItem
                      key={index}
                      containerStyle={styles.ingredientItem}
                    >
                      <ListItem.Content>
                        <ListItem.Title>{`${ingredient.amount} ${ingredient.unit} ${ingredient.name}`}</ListItem.Title>
                        {ingredient.energy_kcal && (
                          <ListItem.Subtitle style={styles.nutritionText}>
                            {ingredient.energy_kcal.toFixed(0)} kcal,{' '}
                            {ingredient.protein?.toFixed(1)}g prot
                          </ListItem.Subtitle>
                        )}
                      </ListItem.Content>
                      <TouchableOpacity onPress={() => removeIngredient(index)}>
                        <Icon
                          name="delete"
                          type="material"
                          color={HexColors['dark-grey']}
                        />
                      </TouchableOpacity>
                    </ListItem>
                  ))}
                </View>

                {recipeTotals.energy > 0 && (
                  <View style={styles.nutritionContainer}>
                    <Text style={styles.sectionTitle}>
                      Nutrition Information (estimated)
                    </Text>
                    <NutritionInfo
                      energy={
                        recipeTotals.energy / Number(getValues('portions'))
                      }
                      protein={
                        recipeTotals.protein / Number(getValues('portions'))
                      }
                      fat={recipeTotals.fat / Number(getValues('portions'))}
                      carbohydrate={
                        recipeTotals.carbohydrate /
                        Number(getValues('portions'))
                      }
                      fiber={recipeTotals.fiber / Number(getValues('portions'))}
                      sugar={recipeTotals.sugar / Number(getValues('portions'))}
                      perPortion={true}
                    />
                  </View>
                )}

                <Text style={styles.text}>Dietary info</Text>
                <View style={{marginHorizontal: 10, marginBottom: 20}}>
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
                    containerStyle={{borderRadius: 10}}
                    selectedTextStyle={{color: HexColors['darker-green']}}
                  />
                </View>

                <Text style={styles.text}>Instructions</Text>
                <Controller
                  control={control}
                  rules={{
                    required: {
                      value: true,
                      message: 'Instructions are required',
                    },
                    minLength: {value: 20, message: 'Minimum 20 characters'},
                    maxLength: {
                      value: 1000,
                      message: 'Maximum 1000 characters',
                    },
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
                        maxLength={4000}
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

                <View style={{flexDirection: 'row', maxWidth: '80%'}}>
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
                            onChange(numericValue);
                          }}
                          value={value?.toString() || ''}
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

                <View style={{flexDirection: 'row', maxWidth: '80%'}}>
                  <View style={{flex: 1}}>
                    <Controller
                      control={control}
                      rules={{
                        required: {
                          value: true,
                          message: 'Portions is required',
                        },
                        max: {value: 20, message: 'Maximum 20 portions'},
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
                            onChange(numericValue);
                          }}
                          value={value?.toString() || ''}
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
                          )?.value || 'Easy',
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
                  title="Save changes"
                  buttonStyle={[
                    styles.button,
                    {backgroundColor: HexColors['medium-green']},
                  ]}
                  titleStyle={styles.buttonTitle}
                  containerStyle={styles.buttonContainer}
                  onPress={handleSubmit(doEditRecipe)}
                  loading={loading}
                  disabled={!isValid || loading}
                  testID="save-changes-button"
                />
              </>
            ),
          },
        ]}
        keyExtractor={(_, index) => `key-${index}`}
        renderItem={({item}) => (
          <Card containerStyle={styles.card}>{item.component}</Card>
        )}
      />
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
  button: {
    backgroundColor: HexColors['almost-white'],
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 15,
    marginBottom: 10,
    marginHorizontal: 10,
    padding: 10,
    elevation: 4,
  },
  buttonContainer: {
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
  buttonTitle: {
    fontFamily: 'InriaSans-Regular',
    fontSize: 14,
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
    marginHorizontal: 10,
    marginBottom: 20,
  },
  ingredientItem: {
    backgroundColor: HexColors['almost-white'],
    borderRadius: 10,
    marginVertical: 5,
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
  searchResultsContainer: {
    marginHorizontal: 10,
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
    marginBottom: 15,
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
  nutritionText: {
    fontSize: 12,
    color: HexColors['dark-grey'],
  },
  nutritionContainer: {
    margin: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: HexColors.white,
    borderColor: HexColors['light-grey'],
    borderWidth: 1,
  },
  nutritionSummaryContainer: {
    marginHorizontal: 10,
    marginVertical: 15,
    padding: 15,
    backgroundColor: HexColors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: HexColors['light-grey'],
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  nutritionLabel: {
    fontSize: 14,
    color: HexColors['dark-grey'],
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: HexColors['medium-green'],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: HexColors['dark-green'],
  },
});

export default EditRecipeForm;
