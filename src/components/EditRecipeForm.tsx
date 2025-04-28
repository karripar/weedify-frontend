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
import {Button, Card, Input, ListItem, Icon} from '@rneui/base';
import MultiSelect from 'react-native-multiple-select';
import {useDietTypes, useRecipes} from '../hooks/apiHooks';
import {NavigationProp, ParamListBase} from '@react-navigation/native';
import {useUpdateContext, useUserContext} from '../hooks/contextHooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Controller, useForm} from 'react-hook-form';
import {LinearGradient} from 'expo-linear-gradient';
import {SelectList} from 'react-native-dropdown-select-list';
import {EditRecipeInputs} from '../types/LocalTypes';

const EditRecipeForm = ({
  navigation,
  route,
}: {
  navigation: NavigationProp<ParamListBase>;
  route: any;
}) => {
  const {user} = useUserContext();
  const {updateRecipe, loading} = useRecipes();
  const {triggerUpdate, update} = useUpdateContext();
  const {getAllDietTypes} = useDietTypes();

  // get the recipe data
  const recipe = route.params.item;

  // set the diet type options
  const [dietTypeOptions, setDietTypeOptions] = useState<
    {key: string; value: string}[]
  >([]);

  const [ingredients, setIngredients] = useState<
    {name: string; amount: string; unit: string}[]
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

  // data for the unit selector (TODO: emt näille vois kattoo viel mitkä olis eniten käytetyimmät ja universaalit)
  const unitData = [
    {key: 'g', value: 'g'},
    {key: 'kg', value: 'kg'},
    {key: 'ml', value: 'ml'},
    {key: 'l', value: 'l'},
    {key: 'tsp', value: 'tsp'},
    {key: 'tbsp', value: 'tbsp'},
    {key: 'cup', value: 'cup'},
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
      }));
      setIngredients(formattedIngredients);

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
      const newIngredient = {
        name: currentIngredient.trim(),
        amount: amount,
        unit: selectedUnit,
      };

      setIngredients([...ingredients, newIngredient]);

      setCurrentIngredient('');
      setAmount('');
      setSelectedUnit('');
    }
  };

  // remove an ingredient
  const removeIngredient = (index: number) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
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
      if (user.user_id !== recipe.user_id) {
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

      updateData.ingredients = ingredients.map((ing) => ({
        name: ing.name,
        amount: parseFloat(ing.amount),
        unit: ing.unit,
      }));

      const dietTypeIds = selectedDiets
        .map((dietName) => {
          const dietOption = dietTypeOptions.find(
            (option) => option.value === dietName,
          );
          return dietOption ? Number(dietOption.key) : null;
        })
        .filter((id) => id !== null);

      updateData.dietary_info = dietTypeIds;

      const response = await updateRecipe(token, recipe.recipe_id, updateData);

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

                <Text style={styles.text}>Dietary info</Text>
                <View style={{marginHorizontal: 10, marginBottom: 20}}>
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
                          message: 'Porpotions is required',
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
});

export default EditRecipeForm;
