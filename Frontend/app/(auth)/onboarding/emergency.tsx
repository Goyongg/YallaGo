import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';

const Emergency = () => {
  const router = useRouter();
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const isFormFilled = contactName.trim().length > 0 && contactPhone.trim().length > 0;

  const handleNext = () => {
    router.push('/onboarding/role');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white justify-around p-8"
    >
      {/* Title + Input Fields */}
      <View>
        <Text className="text-5xl font-bold leading-[60px] tracking-wide mb-6">
          Emergency
          <Text className="text-brand italic"> contact info</Text>
        </Text>

        <View className="mb-4">
          <Text className="text-base font-semibold mb-1 text-gray-700">Contact Name</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="Enter full name"
            value={contactName}
            onChangeText={setContactName}
          />
        </View>

        <View className="mb-6">
          <Text className="text-base font-semibold mb-1 text-gray-700">Contact Phone</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="Enter phone number"
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* Bottom Buttons */}
      <View className="space-y-3">
        <Pressable
          className={`py-5 rounded-xl w-full flex items-center ${
            isFormFilled ? 'bg-brand' : 'bg-gray-300'
          }`}
          disabled={!isFormFilled}
          onPress={handleNext}
        >
          <Text className="text-white font-semibold text-2xl">Next</Text>
        </Pressable>

        <View className="items-center">
        <Pressable
          className="py-2 px-4 rounded-xl w-[130px] items-center"
          onPress={handleNext}
        >
          <Text className="text-gray-600 font-medium text-lg">Skip for now</Text>
        </Pressable>
      </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Emergency;