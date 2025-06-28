import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { isValidEmail } from '@/utils/validation';
import { Ionicons } from '@expo/vector-icons';
import { RegistrationData, useRegistration } from '@/context/RegistrationContext';

const NameAndContact = () => {
  const router = useRouter();
  const { registrationData, setRegistrationData } = useRegistration();

  const [name, setName] = useState(registrationData.name);
  const [gender, setGender] = useState(registrationData.gender);
  const [email, setEmail] = useState(registrationData.email);
  const [phone, setPhone] = useState(registrationData.phone);
  // const [name, setName] = useState('');
  // const [gender, setGender] = useState('');
  // const [email, setEmail] = useState('');
  // const [phone, setPhone] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const isFormValid =
    name.trim().length > 0 &&
    isValidEmail(email) &&
    phone.trim().length > 0;

  const handleNext = () => {
    setRegistrationData((prev: RegistrationData) => ({
      ...prev,
      name,
      gender,
      email,
      phone,
    }));
    router.push({
      pathname: '/onboarding/password',
      params: { email }, // this can stay if you want to show email on password screen
    });
  };

  const handleGenderSelect = (selected: string) => {
    setGender(selected);
  };

  const toggleModal = () => {
    setModalVisible((prev) => !prev);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white justify-center p-8"
    >
      {/* Back Arrow */}
      <Pressable onPress={() => router.back()} className="absolute top-20 left-6 z-10">
        <Text>
          <Ionicons name="arrow-back" size={38} color="#00BD5F" />
        </Text>
      </Pressable>
      
      {/* Top Section */}
      <View>
        <Text className="text-6xl font-bold leading-[60px] tracking-wide mb-6">
          Let us know
          <Text className="text-brand italic"> about you</Text>
        </Text>

        {/* Name Input */}
        <View className="mb-4">
          <Text className="text-base font-semibold mb-1 text-gray-700">Your Name</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#A0AEC0"
          />
        </View>

        {/* Gender Picker */}
        <View className="mb-4">
          <View className='flex-row items-center justify-between'>
            <Text className="text-base font-semibold mb-1 text-gray-700">Gender (optional)</Text>
            <View className="flex-row gap-1">
              {['Male', 'Female'].map((option) => (
                <TouchableOpacity
                  key={option}
                  className={`px-4 py-2 rounded-full border ${
                    gender === option ? 'bg-brand border-brand' : 'border-gray-300'
                  }`}
                  onPress={() => handleGenderSelect(option)}
                >
                  <Text className={gender === option ? 'text-white' : 'text-black'}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text
            onPress={toggleModal}
            className="text-brand text-sm mt-2 self-start"
          >
            Why we need this info?
          </Text>
        </View>

        {/* Email Input */}
        <View className="mb-4">
          <Text className="text-base font-semibold mb-1 text-gray-700">Email</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#A0AEC0"
          />

          {/* Email validation error */}
          {email.length > 0 && !isValidEmail(email) && (
            <Text className="text-red-500 text-sm mt-1">Enter a valid email address</Text>
          )}
        </View>

        {/* Phone Input */}
        <View className="mb-6">
          <Text className="text-base font-semibold mb-1 text-gray-700">Phone Number</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="Enter your phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#A0AEC0"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>
      </View>

      {/* Bottom Button */}
      <Pressable
        className={`py-5 rounded-xl w-full flex items-center ${
          isFormValid ? 'bg-brand' : 'bg-gray-300'
        }`}
        disabled={!isFormValid}
        onPress={handleNext}
      >
        <Text className="text-white font-semibold text-2xl">Next</Text>
      </Pressable>

      {/* Gender Info Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={toggleModal}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white p-6 rounded-xl w-full max-w-md">
            <Text className="text-lg font-bold mb-2">Why we need this info</Text>
            <Text className="text-gray-600 mb-4">
              We ask for your gender to enable “female-only” ride options.
              Further ID confirmation may be required later.
            </Text>
            <Pressable
              className="bg-brand px-4 py-2 rounded-lg self-end"
              onPress={toggleModal}
            >
              <Text className="text-white font-semibold">Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default NameAndContact;
