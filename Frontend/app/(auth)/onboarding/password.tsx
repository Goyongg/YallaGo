import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRegistration } from '@/context/RegistrationContext';
import { isValidPassword } from '@/utils/validation';

const Password = () => {
  const router = useRouter();
  const { registrationData, setRegistrationData } = useRegistration();
  const { email } = useLocalSearchParams<{ email?: string }>(); // get email from params
  const [password, setPassword] = useState(registrationData.password);

  const [loading, setLoading] = useState(false);

  const isValid = isValidPassword(password);

  const handleNext = () => {
    setLoading(true);

    setRegistrationData((prev) => ({
      ...prev,
      password: password.trim(), // avoid user tapping "Next" if they enter only spaces
    }));

    // Slight delay to let UI show the spinner before navigating
    setTimeout(() => {
      router.push('/onboarding/emergency');
      setLoading(false);
    }, 250);
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
      {/* Top Section */}
      <View>
        <Text className="text-5xl font-bold leading-[60px] tracking-wide mb-6">
          Create a
          <Text className="text-brand italic"> password</Text>
        </Text>

        <Text className="text-base text-gray-600 mb-6">
          For{" "}<Text className="font-semibold">{email ?? 'your account'}</Text>
        </Text>

        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          placeholder="Enter your password (min 6 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#A0AEC0"
        />
      </View>

      {/* Bottom Button */}
      <Pressable
        className={`py-5 rounded-xl w-full flex items-center ${
          isValid && !loading ? 'bg-brand' : 'bg-gray-300'
        }`}
        disabled={!isValid || loading}
        onPress={handleNext}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-white font-semibold text-2xl">Next</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
};

export default Password;