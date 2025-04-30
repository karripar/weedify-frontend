import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {HexColors} from '../utils/colors';

interface NutritionInfoProps {
  energy: number;
  protein: number;
  fat: number;
  carbohydrate: number;
  fiber: number;
  sugar: number;
  perPortion?: boolean;
}

const NutritionInfo = ({
  energy,
  protein,
  fat,
  carbohydrate,
  fiber,
  sugar,
  perPortion = false,
}: NutritionInfoProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Nutrition Information {perPortion ? 'per Portion' : 'per 100g'}
      </Text>

      <View style={styles.row}>
        <Text style={styles.label}>Energy:</Text>
        <Text style={styles.value}>{energy.toFixed(1)} kcal</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Protein:</Text>
        <Text style={styles.value}>{protein.toFixed(1)} g</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Fat:</Text>
        <Text style={styles.value}>{fat.toFixed(1)} g</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Carbohydrates:</Text>
        <Text style={styles.value}>{carbohydrate.toFixed(1)} g</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Fiber:</Text>
        <Text style={styles.value}>{fiber.toFixed(1)} g</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Sugar:</Text>
        <Text style={styles.value}>{sugar.toFixed(1)} g</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: HexColors.white,
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: HexColors['light-grey'],
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: HexColors['dark-grey'],
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: HexColors['light-grey'],
  },
  label: {
    fontSize: 14,
    color: HexColors['dark-grey'],
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: HexColors['medium-green'],
  },
});

export default NutritionInfo;
