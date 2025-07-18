// components/ReviewModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  TouchableWithoutFeedback,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import { BASE_URL } from '@/config';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  rideId: string;
  targetName: string; // Name of the person being reviewed
  userRole: 'driver' | 'passenger';
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  rideId,
  targetName,
  userRole,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarPress = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating');
      return;
    }

    try {
      setIsSubmitting(true);

      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const idToken = await user.getIdToken();

      const reviewPayload = {
        rideId,
        rating,
        comment: comment.trim() || undefined, // Only send comment if it's not empty
      };

      console.log('Submitting review:', reviewPayload);

      const response = await axios.post(`${BASE_URL}/reviews`, reviewPayload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });

      console.log('Review submitted successfully:', response.data);

      Alert.alert(
        'Thank You!',
        'Your review has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setRating(0);
              setComment('');
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting review:', error);
      
      let errorMessage = 'Failed to submit review. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/50">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-t-3xl px-6 py-6 max-h-[80%]">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-bold font-[Afacad] text-black">
                  Rate Your {userRole === 'driver' ? 'Passenger' : 'Driver'}
                </Text>
                <Pressable onPress={handleCancel}>
                  <Ionicons name="close" size={24} color="#666" />
                </Pressable>
              </View>

              {/* Target Person */}
              <View className="items-center mb-6">
                <View className="w-16 h-16 bg-gray-200 rounded-full items-center justify-center mb-3">
                  <Ionicons name="person" size={32} color="#666" />
                </View>
                <Text className="text-lg font-[Afacad] font-medium text-black">
                  {targetName}
                </Text>
              </View>

              {/* Star Rating */}
              <View className="items-center mb-6">
                <Text className="text-base font-[Afacad] text-gray-700 mb-4">
                  How was your experience?
                </Text>
                <View className="flex-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => handleStarPress(star)}
                      className="mx-2"
                    >
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={36}
                        color={star <= rating ? '#FFD700' : '#CCC'}
                      />
                    </Pressable>
                  ))}
                </View>
                {rating > 0 && (
                  <Text className="text-sm font-[Afacad] text-gray-600 mt-2">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </Text>
                )}
              </View>

              {/* Comment Section */}
              <View className="mb-6">
                <Text className="text-base font-[Afacad] text-gray-700 mb-3">
                  Leave a comment <Text className="text-gray-500">(optional)</Text>
                </Text>
                <View className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
                  <TextInput
                    value={comment}
                    onChangeText={setComment}
                    placeholder={`Share your experience with ${targetName}...`}
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="text-base font-[Afacad] text-black min-h-[80px]"
                    maxLength={500}
                  />
                </View>
                <Text className="text-xs text-gray-500 mt-1 font-[Afacad]">
                  {comment.length}/500 characters
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row space-x-3">
                <Pressable
                  onPress={handleCancel}
                  className="flex-1 bg-gray-200 py-4 rounded-lg items-center"
                  disabled={isSubmitting}
                >
                  <Text className="text-gray-700 text-base font-[Afacad] font-medium">
                    Cancel
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={handleSubmit}
                  disabled={rating === 0 || isSubmitting}
                  className={`flex-1 py-4 rounded-lg items-center ${
                    rating === 0 || isSubmitting
                      ? 'bg-gray-300'
                      : 'bg-[#00BD5F]'
                  }`}
                >
                  <Text className={`text-base font-[Afacad] font-medium ${
                    rating === 0 || isSubmitting
                      ? 'text-gray-500'
                      : 'text-white'
                  }`}>
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </Text>
                </Pressable>
              </View>

              {/* Rating Required Notice */}
              <Text className="text-xs text-gray-500 text-center mt-3 font-[Afacad]">
                * Star rating is required to complete your review
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ReviewModal;