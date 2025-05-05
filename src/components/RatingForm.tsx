import React, {useState} from 'react';
import {View, StyleSheet, Modal, TextInput, Alert} from 'react-native';
import {Button, Text} from '@rneui/base';
import {HexColors} from '../utils/colors';
import StarRating from 'react-native-star-rating-widget';

type RatingFormProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => Promise<void>;
  recipe_id: number;
};

const RatingForm = ({
  visible,
  onClose,
  onSubmit,
  recipe_id,
}: RatingFormProps) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // post the rating via form
  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(rating, review);
      setRating(0);
      setReview('');
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Rate this recipe</Text>
          <StarRating rating={rating} onChange={setRating} enableHalfStar={false}/>

          <Text style={styles.reviewLabel}>Review (optional):</Text>
          <TextInput
            testID="review-input"
            style={styles.reviewInput}
            multiline
            numberOfLines={4}
            placeholder="Share your thoughts about this recipe..."
            value={review}
            placeholderTextColor={HexColors['grey']}
            onChangeText={setReview}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              onPress={onClose}
              buttonStyle={styles.cancelButton}
              titleStyle={[styles.buttonText, {color: HexColors.grey}]}
            />
            <Button
              testID="submit-rating"
              title="Submit"
              onPress={handleSubmit}
              loading={isSubmitting}
              buttonStyle={styles.submitButton}
              titleStyle={styles.buttonText}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'InriaSans-Bold',
    color: HexColors['dark-green'],
    marginBottom: 20,
  },
  ratingLabel: {
    alignSelf: 'flex-start',
    fontSize: 16,
    fontFamily: 'InriaSans-Regular',
    marginBottom: 10,
  },
  reviewLabel: {
    alignSelf: 'flex-start',
    fontSize: 16,
    fontFamily: 'InriaSans-Regular',
    marginTop: 20,
    marginBottom: 10,
  },
  reviewInput: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderColor: HexColors['light-grey'],
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
    marginBottom: 20,
    color: HexColors['dark-grey'],
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  cancelButton: {
    backgroundColor: HexColors['light-grey'],
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  submitButton: {
    backgroundColor: HexColors['medium-green'],
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontFamily: 'InriaSans-Regular',
    fontSize: 16,
  },
});

export default RatingForm;
