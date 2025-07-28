import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRegistration } from '@/context/RegistrationContext';
import { registerUser } from '@/services/register';
import { useTranslation } from 'react-i18next';

const DriverLicense = () => {
  const { t } = useTranslation('(auth)/onboarding/driver-license');

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
      Alert.alert(t('invalidAlertTitle'), t('invalidAlertMessage'));
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
      Alert.alert(t('errorAlertTitle'), err.message || t('errorAlertMessage'));
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
          {t('title')}
          <Text className="text-brand italic"> {t('highlight')}</Text>
        </Text>

        <Text className="text-base text-gray-600 mb-6">
          {t('subtitle')}
        </Text>

        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          placeholder={t('placeholder')}
          value={licenseNumber}
          onChangeText={handleLicenseChange}
          keyboardType="numeric"
          maxLength={10}
          placeholderTextColor="#A0AEC0"
        />
        
        {/* Simple validation hint */}
        {licenseNumber.length > 0 && licenseNumber.length < 6 && (
          <Text className="text-orange-500 text-sm mt-2">
            {t('validationHint')}
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
          <Text className="text-white font-semibold text-2xl">{t('submit')}</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
};

export default DriverLicense;