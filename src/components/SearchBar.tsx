import React, {useState, useEffect} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {Button} from '@rneui/base';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {HexColors} from '../utils/colors';
import {RecipeWithOwnerExtended, DietTypeWithName} from '../types/LocalTypes';
import {useDietTypes} from '../hooks/apiHooks';

interface SearchBarProps {
  recipeArray: RecipeWithOwnerExtended[];
  onFilterChange: (
    filteredRecipes: RecipeWithOwnerExtended[],
    hasActiveFilters: boolean,
  ) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({recipeArray, onFilterChange}) => {
  const [searchText, setSearchText] = useState('');
  const [cookingTimeFilter, setCookingTimeFilter] = useState('all');
  const [dietTypeFilter, setDietTypeFilter] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const [availableDietTypes, setAvailableDietTypes] = useState<string[]>([]);
  const {getAllDietTypes} = useDietTypes();

  const prevFilterRef = React.useRef('');

  // Fetch all diet types when component mounts
  useEffect(() => {
    const fetchDietTypes = async () => {
      try {
        const dietTypes = await getAllDietTypes();
        if (Array.isArray(dietTypes)) {
          // Extract diet names from the response
          const dietNames = dietTypes.map((diet) => diet.diet_type_name);
          setAvailableDietTypes(dietNames);
        }
      } catch (error) {
        console.error('Error fetching diet types:', error);
      }
    };

    fetchDietTypes();
  }, []);

  useEffect(() => {
    if (!recipeArray) return;

    let filtered = [...recipeArray];

    // filter by title OR ingredients OR username
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter((recipe) => {
        // Search by recipe title
        const titleMatch = recipe.title.toLowerCase().includes(searchLower);

        // Search by ingredient name
        const ingredientMatch =
          recipe.ingredients &&
          recipe.ingredients.some((ingredient) =>
            ingredient.name.toLowerCase().includes(searchLower),
          );

        // Search by username
        const usernameMatch = recipe.username
          .toLowerCase()
          .includes(searchLower);

        // Return true if any of the fields match
        return titleMatch || ingredientMatch || usernameMatch;
      });
    }

    // Filter by cooking time
    if (cookingTimeFilter !== 'all') {
      filtered = filtered.filter((recipe) => {
        const cookingTime = recipe.cooking_time;
        if (cookingTimeFilter === 'under30' && cookingTime < 30) return true;
        if (
          cookingTimeFilter === '30to60' &&
          cookingTime >= 30 &&
          cookingTime <= 60
        )
          return true;
        if (cookingTimeFilter === 'over60' && cookingTime > 60) return true;
        return false;
      });
    }

    // Filter by diet types
    if (dietTypeFilter.length > 0) {
      filtered = filtered.filter((recipe) => {
        const dietTypes = recipe.diet_types;
        if (!dietTypes) return false;

        // Check if the recipe has all of the selected diet types
        return dietTypeFilter.every((selectedDiet) =>
          dietTypes.some(
            (recipeDiet: DietTypeWithName) =>
              recipeDiet.name.toLowerCase() === selectedDiet.toLowerCase(),
          ),
        );
      });
    }

    // Sort by creation date or likes
    filtered.sort((a, b) => {
      if (sortOrder === 'oldest' || sortOrder === 'newest') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();

        if (sortOrder === 'oldest') {
          return dateA - dateB; // Oldest first
        } else {
          return dateB - dateA; // Newest first
        }
      } else if (sortOrder === 'likes') {
        // Varmista että likes_count on numero
        const likesA = a.likes_count !== undefined ? Number(a.likes_count) : 0;
        const likesB = b.likes_count !== undefined ? Number(b.likes_count) : 0;
        return likesB - likesA; // Eniten tykätyt ensin
      }

      return 0;
    });

    // Check if any filters are active
    const hasActiveFilters =
      searchText.trim() !== '' ||
      cookingTimeFilter !== 'all' ||
      dietTypeFilter.length > 0 ||
      sortOrder !== 'newest';

    // TÄÄ RIVI ESTÄÄ IKUISEN LOOPIN
    const currentFilterString = JSON.stringify(
      filtered.map((r) => r.recipe_id),
    );
    if (currentFilterString !== prevFilterRef.current) {
      prevFilterRef.current = currentFilterString;
      onFilterChange(filtered, hasActiveFilters);
    }
  }, [recipeArray, searchText, cookingTimeFilter, dietTypeFilter, sortOrder]);

  // Reset search filters
  const resetFilters = () => {
    setSearchText('');
    setCookingTimeFilter('all');
    setDietTypeFilter([]);
    setSortOrder('newest');
  };

  return (
    <>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={HexColors['dark-grey']} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search by recipe, ingredient, or user..."
            placeholderTextColor={HexColors['dark-grey']}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={24} color={HexColors['dark-grey']} />
        </TouchableOpacity>
      </View>
      <Modal
        visible={showFilters}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={true}>
              <Text style={styles.modalTitle}>Filter Recipes</Text>

              <Text style={styles.filterLabel}>Cooking Time</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    cookingTimeFilter === 'all' && styles.selectedOption,
                  ]}
                  onPress={() => setCookingTimeFilter('all')}
                >
                  <Text>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    cookingTimeFilter === 'under30' && styles.selectedOption,
                  ]}
                  onPress={() => setCookingTimeFilter('under30')}
                >
                  <Text>Under 30 min</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    cookingTimeFilter === '30to60' && styles.selectedOption,
                  ]}
                  onPress={() => setCookingTimeFilter('30to60')}
                >
                  <Text>30-60 min</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    cookingTimeFilter === 'over60' && styles.selectedOption,
                  ]}
                  onPress={() => setCookingTimeFilter('over60')}
                >
                  <Text>Over 60 min</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.filterLabel}>Sort Order</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    sortOrder === 'newest' && styles.selectedOption,
                  ]}
                  onPress={() => setSortOrder('newest')}
                >
                  <Text>Newest first</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    sortOrder === 'oldest' && styles.selectedOption,
                  ]}
                  onPress={() => setSortOrder('oldest')}
                >
                  <Text>Oldest first</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    sortOrder === 'rating' && styles.selectedOption,
                  ]}
                  onPress={() => {}}
                >
                  <Text>Highest rating</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    sortOrder === 'likes' && styles.selectedOption,
                  ]}
                  onPress={() => setSortOrder('likes')}
                >
                  <Text>Most liked</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.filterLabel}>Difficulty Level</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={styles.filterOption}
                  onPress={() => {}}
                >
                  <Text>Easy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterOption}
                  onPress={() => {}}
                >
                  <Text>Medium</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterOption}
                  onPress={() => {}}
                >
                  <Text>Hard</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.filterLabel}>Diets</Text>
              <ScrollView style={styles.dietContainer}>
                {availableDietTypes.map((diet) => (
                  <TouchableOpacity
                    key={diet}
                    style={[
                      styles.filterOption,
                      dietTypeFilter.includes(diet) && styles.selectedOption,
                    ]}
                    onPress={() => {
                      if (dietTypeFilter.includes(diet)) {
                        setDietTypeFilter(
                          dietTypeFilter.filter((item) => item !== diet),
                        );
                      } else {
                        setDietTypeFilter([...dietTypeFilter, diet]);
                      }
                    }}
                  >
                    <Text>{diet}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalButtons}>
                <Button
                  title="Clear"
                  onPress={resetFilters}
                  type="outline"
                  buttonStyle={styles.modalButton}
                />
                <Button
                  title="Close"
                  onPress={() => setShowFilters(false)}
                  buttonStyle={[
                    styles.modalButton,
                    {backgroundColor: HexColors['dark-green']},
                  ]}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    padding: 5,
    color: HexColors['dark-grey'],
  },
  filterButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: HexColors['darkest-green'],
  },
  filterLabel: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 10,
    color: HexColors['dark-grey'],
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  filterOption: {
    padding: 8,
    margin: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedOption: {
    backgroundColor: HexColors['light-green'],
    borderColor: HexColors['dark-green'],
  },
  dietContainer: {
    maxHeight: 200,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  modalButton: {
    borderRadius: 20,
    paddingHorizontal: 30,
    margin: 10
  },
});

export default SearchBar;
