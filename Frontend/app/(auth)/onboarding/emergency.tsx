import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useRegistration } from '@/context/RegistrationContext';
import { Ionicons } from '@expo/vector-icons';

const Emergency = () => {
  const router = useRouter();
  const { registrationData, setRegistrationData } = useRegistration();

  const [contactName, setContactName] = useState(registrationData.emergencyContact.name);
  const [contactPhone, setContactPhone] = useState(registrationData.emergencyContact.phone);
  // const [contactName, setContactName] = useState('');
  // const [contactPhone, setContactPhone] = useState('');

  const isFormFilled = contactName.trim().length > 0 && contactPhone.trim().length > 0;

  const handleNext = () => {
    setRegistrationData((prev) => ({
      ...prev,
      emergencyContact: {
        name: contactName.trim(),
        phone: contactPhone.trim(),
      },
    }));

    router.push('/onboarding/role');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white justify-around p-8"
    >
      {/* Back Arrow */}
      <Pressable onPress={() => router.back()} className="absolute top-20 left-6 z-10">
        <Text>
          <Ionicons name="arrow-back" size={38} color="#00BD5F" />
        </Text>
      </Pressable>
      
      {/* Title + Input Fields */}
      <View>
        <Text className="text-5xl font-bold leading-[60px] tracking-wide mb-6">
          Emergency
          <Text className="text-brand italic"> contact</Text>
        </Text>

        <Text className="text-base text-gray-600 mb-6">
          Please provide someone we can contact in case of an emergency.
        </Text>

        <View className="mb-4">
          <Text className="text-base font-semibold mb-1 text-gray-700">Contact Name</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="Enter full name"
            value={contactName}
            onChangeText={setContactName}
            placeholderTextColor="#A0AEC0"
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
            placeholderTextColor="#A0AEC0"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
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