import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {Input} from '@rneui/themed';
import {HexColors} from '../utils/colors';
import debounce from 'lodash/debounce';

interface IngredientSearchProps {
  onSelectIngredient: (ingredient: any) => void;
}

interface IngredientItem {
  id: number;
  name: {
    en: string;
  };
  energyKcal: number;
  protein: number;
  fat: number;
  carbohydrate: number;
  fiber: number;
  sugar: number;
}

const IngredientSearch = ({onSelectIngredient}: IngredientSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<IngredientItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Debounced search function
  const debouncedSearch = debounce(async (term: string) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_MEDIA_API}/ingredients/search?searchTerm=${encodeURIComponent(term)}`,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch ingredients');
      }

      const data = await response.json();
      setSearchResults(data.ingredients || []);
    } catch (err) {
      console.error('Error searching ingredients:', err);
      setError('Failed to search ingredients');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, 500);

  // Trigger search when search term changes
  useEffect(() => {
    debouncedSearch(searchTerm);

    // Cancel debounced function on cleanup
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm]);

  const handleSelectIngredient = (ingredient: IngredientItem) => {
    onSelectIngredient(ingredient);
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <View style={styles.container}>
      <Input
        placeholder="Search ingredients..."
        value={searchTerm}
        onChangeText={(text) => {
          setSearchTerm(text);
          if (text.length >= 2) {
            setShowResults(true);
          } else {
            setShowResults(false);
          }
        }}
        style={styles.input}
        inputContainerStyle={styles.inputContainer}
        rightIcon={
          loading ? (
            <ActivityIndicator size="small" color={HexColors['medium-green']} />
          ) : undefined
        }
        testID="ingredient-search-input"
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Näytä tulokset suoraan lomakkeessa ScrollView:n avulla */}
      {showResults && searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <ScrollView style={styles.list} nestedScrollEnabled={true}>
            {searchResults.map((item) => (
              <TouchableOpacity
                key={item.id.toString()}
                style={styles.resultItem}
                onPress={() => handleSelectIngredient(item)}
                testID={`ingredient-item-${item.id}`}
              >
                <Text style={styles.itemName}>{item.name.en}</Text>
                <Text style={styles.itemNutrition}>
                  {item.energyKcal.toFixed(1)} kcal | {item.protein.toFixed(1)}g
                  protein
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    zIndex: 100,
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
  resultsContainer: {
    marginHorizontal: 10,
    maxHeight: 200,
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
  list: {
    maxHeight: 200,
  },
  resultItem: {
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
  errorText: {
    color: 'red',
    marginLeft: 10,
    marginBottom: 5,
  },
});

export default IngredientSearch;
