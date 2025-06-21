import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const Password = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>(); // get email from params
  const [password, setPassword] = useState('');

  const isValid = password.trim().length > 0;

  const handleNext = () => {
    router.push('/onboarding/emergency');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white justify-around p-8"
    >
      {/* Top Section */}
      <View>
        <Text className="text-5xl font-bold leading-[60px] tracking-wide mb-6">
          Create a
          <Text className="text-brand italic"> password</Text>
        </Text>

        <Text className="text-base text-gray-600 mb-6">
          For <Text className="font-semibold">{email ?? 'your account'}</Text>
        </Text>

        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#A0AEC0"
        />
      </View>

      {/* Bottom Button */}
      <Pressable
        className={`py-5 rounded-xl w-full flex items-center ${
          isValid ? 'bg-brand' : 'bg-gray-300'
        }`}
        disabled={!isValid}
        onPress={handleNext}
      >
        <Text className="text-white font-semibold text-2xl">Next</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
};

export default Password;