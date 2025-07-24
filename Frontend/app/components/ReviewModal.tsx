// components/ReviewModal.tsx - MANDATORY VERSION
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
  mandatory?: boolean; // NEW: Whether the review is mandatory
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  rideId,
  targetName,
  userRole,
  mandatory = false, // Default to false for backward compatibility
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

      // Reset form
      setRating(0);
      setComment('');
      
      if (mandatory) {
        // For mandatory reviews, show success message and close automatically
        Alert.alert(
          'Thank You!',
          'Your review has been submitted successfully.',
          [
            {
              text: 'OK',
              onPress: onClose,
            },
          ]
        );
      } else {
        // For optional reviews, show success and close
        Alert.alert(
          'Thank You!',
          'Your review has been submitted successfully.',
          [
            {
              text: 'OK',
              onPress: onClose,
            },
          ]
        );
      }
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
    if (mandatory) {
      // Prevent closing mandatory review without rating
      Alert.alert(
        'Review Required',
        'You must provide a star rating to continue. The review is required to complete your ride.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Only allow canceling for non-mandatory reviews
    setRating(0);
    setComment('');
    onClose();
  };

  const handleBackdropPress = () => {
    if (mandatory) {
      // Prevent closing mandatory review by tapping backdrop
      Alert.alert(
        'Review Required',
        'Please complete your review by providing a star rating.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Allow closing for non-mandatory reviews
    onClose();
  };

  return (
    <Modal 
      transparent 
      visible={visible} 
      animationType="slide" 
      onRequestClose={mandatory ? undefined : onClose} // Disable Android back button for mandatory reviews
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View className="flex-1 justify-end bg-black/50">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-t-3xl px-6 py-6 max-h-[80%]">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-bold font-[Afacad] text-black">
                  Rate Your {userRole === 'driver' ? 'Passenger' : 'Driver'}
                </Text>
                {/* Only show close button for non-mandatory reviews */}
                {!mandatory && (
                  <Pressable onPress={handleCancel}>
                    <Ionicons name="close" size={24} color="#666" />
                  </Pressable>
                )}
                {/* Show warning icon for mandatory reviews */}
                {mandatory && (
                  <View className="bg-red-100 px-2 py-1 rounded-full">
                    <Text className="text-red-600 text-xs font-[Afacad] font-medium">
                      Required
                    </Text>
                  </View>
                )}
              </View>

              {/* Mandatory Review Notice */}
              {mandatory && (
                <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <View className="flex-row items-center">
                    <Ionicons name="information-circle" size={20} color="#F59E0B" />
                    <Text className="text-yellow-700 text-sm font-[Afacad] ml-2 flex-1">
                      This review is required to complete your ride. Please provide a star rating.
                    </Text>
                  </View>
                </View>
              )}

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
                  How was your experience? <Text className="text-red-500">*</Text>
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
                {rating === 0 && mandatory && (
                  <Text className="text-sm font-[Afacad] text-red-500 mt-2">
                    Please select a rating to continue
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
              <View className={mandatory ? "w-full" : "flex-row space-x-3"}>
                {/* Only show Cancel button for non-mandatory reviews */}
                {!mandatory && (
                  <Pressable
                    onPress={handleCancel}
                    className="flex-1 bg-gray-200 py-4 rounded-lg items-center mr-3"
                    disabled={isSubmitting}
                  >
                    <Text className="text-gray-700 text-base font-[Afacad] font-medium">
                      Cancel
                    </Text>
                  </Pressable>
                )}
                
                <Pressable
                  onPress={handleSubmit}
                  disabled={rating === 0 || isSubmitting}
                  className={`${mandatory ? 'w-full' : 'flex-1'} py-4 rounded-lg items-center ${
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
                    {isSubmitting ? 'Submitting...' : mandatory ? 'Complete Review' : 'Submit Review'}
                  </Text>
                </Pressable>
              </View>

              {/* Rating Required Notice */}
              <Text className="text-xs text-gray-500 text-center mt-3 font-[Afacad]">
                * Star rating is required {mandatory ? 'to complete your ride' : 'to submit your review'}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ReviewModal;