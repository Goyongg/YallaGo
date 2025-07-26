import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRegistration } from '@/context/RegistrationContext';
import { registerUser } from '@/services/register';

const DriverLicense = () => {
  const router = useRouter();
  const { registrationData, setRegistrationData } = useRegistration();
  const [licenseNumber, setLicenseNumber] = useState(registrationData.license);
  const [loading, setLoading] = useState(false);

  // Simple validation: at least 6 digits
  const isValid = licenseNumber.trim().length >= 6;

  const handleLicenseChange = (text: string) => {
    // Only allow numbers - filter out everything else
    const numbersOnly = text.replace(/[^0-9]/g, '');
    setLicenseNumber(numbersOnly);
  };

  const handleSubmit = async () => {
    if (licenseNumber.trim().length < 6) {
      Alert.alert("Invalid License", "License number must be at least 6 digits");
      return;
    }

    const finalData = {
      ...registrationData,
      license: licenseNumber.trim(),
    };

    setRegistrationData(finalData);
    setLoading(true);

    try {
      await registerUser(finalData);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      Alert.alert("Registration Failed", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
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
        <Text className="text-5xl font-bold leading-[60px] tracking-wide mb-4">
          Driver
          <Text className="text-brand italic"> verification</Text>
        </Text>

        <Text className="text-base text-gray-600 mb-6">
          Please enter your valid UAE driver's license number. Further ID verification may be required later.
        </Text>

        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          placeholder="License Number (numbers only)"
          value={licenseNumber}
          onChangeText={handleLicenseChange}
          keyboardType="numeric"
          maxLength={10}
          placeholderTextColor="#A0AEC0"
        />
        
        {/* Simple validation hint */}
        {licenseNumber.length > 0 && licenseNumber.length < 6 && (
          <Text className="text-orange-500 text-sm mt-2">
            License number must be at least 6 digits
          </Text>
        )}
      </View>

      {/* Submit Button */}
      <Pressable
        className={`py-5 rounded-xl w-full flex items-center ${
          isValid && !loading ? 'bg-brand' : 'bg-gray-300'
        }`}
        disabled={!isValid || loading}
        onPress={handleSubmit}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-white font-semibold text-2xl">Submit</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
};

export default DriverLicense;