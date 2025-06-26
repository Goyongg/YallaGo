import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// import { useRegistration } from '@/context/RegistrationContext';
// import { registerUser } from '@/services/register';

const DriverLicense = () => {
  const router = useRouter();
  // const { registrationData, setRegistrationData } = useRegistration();
  // const [licenseNumber, setLicenseNumber] = useState(registrationData.license);
  const [licenseNumber, setLicenseNumber] = useState('');
  // const [loading, setLoading] = useState(false);

  const isValid = licenseNumber.trim().length > 0;

  const handleSubmit = async () => {
    // setRegistrationData((prev) => ({
    //   ...prev,
    //   license: licenseNumber,
    // }));

    // setLoading(true);
    // try {
    //   await registerUser({
    //     ...registrationData,
    //     license: licenseNumber,
    //   });

    //   router.replace('/(tabs)/home');
    // } catch (err: any) {
    //   Alert.alert("Registration Failed", err.message || "Something went wrong");
    // } finally {
    //   setLoading(false);
    // }

    router.replace('/(tabs)/home');
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
          Please enter your valid UAE driver’s license number. Further ID verification may be required later.
        </Text>

        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          placeholder="License Number"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          autoCapitalize="characters"
        />
      </View>

      {/* Submit Button */}
      <Pressable
        className={`py-5 rounded-xl w-full flex items-center ${
          isValid ? 'bg-brand' : 'bg-gray-300'
        }`}
        disabled={!isValid}
        onPress={handleSubmit}
      >
        <Text className="text-white font-semibold text-2xl">
          Submit
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
};

export default DriverLicense;