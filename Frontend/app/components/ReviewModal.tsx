// components/ReviewModal.tsx - FIXED VERSION
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import { BASE_URL } from '@/config';
import { useTranslation } from 'react-i18next';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  rideId: string;
  targetName: string; // Name of the person being reviewed
  targetId: string; // ID of the person being reviewed (passengerId or driverId)
  userRole: 'driver' | 'passenger';
  mandatory?: boolean; // NEW: Whether the review is mandatory
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  rideId,
  targetName,
  targetId, // ✅ FIX: Add targetId prop
  userRole,
  mandatory = false, // Default to false for backward compatibility
}) => {
  const { t } = useTranslation('components/ReviewModal');

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarPress = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(t('alerts.rating.title'), t('alerts.rating.body'));
      return;
    }

    try {
      setIsSubmitting(true);

      const user = auth().currentUser;
      if (!user) {
        Alert.alert(t('alerts.auth.title'), t('alerts.auth.body'));
        return;
      }

      const idToken = await user.getIdToken();
      const userId = user.uid; // ✅ FIX: Get the userId from Firebase auth

      const reviewPayload: any = {
        rideId,
        rating,
        comment: comment.trim() || undefined, // Only send comment if it's not empty
      };

      // ✅ FIX: Only add passengerId when driver is reviewing passenger
      if (userRole === 'driver') {
        reviewPayload.passengerId = targetId;
      }
      // ✅ FIX: No additional fields needed when passenger reviews driver

      console.log('Submitting review payload:', reviewPayload);

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
          t('alerts.success.title'), 
          t('alerts.success.body'),
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
          t('alerts.success.title'), 
          t('alerts.success.body'),
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
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert(t('alerts.error.title'), errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (mandatory) {
      // Prevent closing mandatory review without rating
      Alert.alert(
        t('alerts.backdrop.title'),
        t('alerts.backdrop.body'),
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
                  {t(userRole === 'driver' ? 'title.passenger' : 'title.driver')}
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
                      {t('required')}
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
                      {t('mandatoryNotice')}
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
                  {t('experiencePrompt')} <Text className="text-red-500">*</Text>
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
                    {rating === 1 && t('ratings.1')}
                    {rating === 2 && t('ratings.2')}
                    {rating === 3 && t('ratings.3')}
                    {rating === 4 && t('ratings.4')}
                    {rating === 5 && t('ratings.5')}
                  </Text>
                )}
                {rating === 0 && mandatory && (
                  <Text className="text-sm font-[Afacad] text-red-500 mt-2">
                    {t('ratingRequired')}
                  </Text>
                )}
              </View>

              {/* Comment Section */}
              <View className="mb-6">
                <Text className="text-base font-[Afacad] text-gray-700 mb-3">
                  {t('commentLabel')} <Text className="text-gray-500">{t('optional')}</Text>
                </Text>
                <View className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
                  <TextInput
                    value={comment}
                    onChangeText={setComment}
                    placeholder={t('commentPlaceholder', { name: targetName })}
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="text-base font-[Afacad] text-black min-h-[80px]"
                    maxLength={500}
                  />
                </View>
                <Text className="text-xs text-gray-500 mt-1 font-[Afacad]">
                  {comment.length}/500 {t('characters')}
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
                      {t('cancel')}
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
                    {isSubmitting ? t('submitting') : mandatory ? t('completeReview') : t('submitReview')}
                  </Text>
                </Pressable>
              </View>

              {/* Rating Required Notice */}
              <Text className="text-xs text-gray-500 text-center mt-3 font-[Afacad]">
                * {t(mandatory ? 'footer.mandatory' : 'footer.optional')}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ReviewModal;