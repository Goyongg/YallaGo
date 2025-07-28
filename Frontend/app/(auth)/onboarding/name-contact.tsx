import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { isValidEmail, validatePhoneNumber, COUNTRY_CODES, formatPhoneWithCountryCode, CountryCode } from '@/utils/validation';
import { Ionicons } from '@expo/vector-icons';
import { RegistrationData, useRegistration } from '@/context/RegistrationContext';
import { useTranslation } from 'react-i18next';

// Export the phone input component for reuse
export const PhoneInputWithCountryCode = ({ 
  phone, 
  onPhoneChange, 
  onValidate, 
  phoneError, 
  selectedCountryCode, 
  onCountryChange,
  placeholder = "551234567"
}: {
  phone: string;
  onPhoneChange: (value: string) => void;
  onValidate: () => boolean;
  phoneError: string;
  selectedCountryCode: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  placeholder?: string;
}) => {
  const [countryDropdownVisible, setCountryDropdownVisible] = useState(false);

  return (
    <View className="relative">
      {/* Phone Input Container */}
      <View className={`flex-row border rounded-lg overflow-hidden ${
        phoneError ? 'border-red-500' : 'border-gray-300'
      }`}>
        {/* Country Code Selector */}
        <Pressable
          onPress={() => setCountryDropdownVisible(!countryDropdownVisible)}
          className="flex-row items-center px-3 py-3 bg-gray-50 border-r border-gray-200"
        >
          <Text className="text-lg mr-1">{selectedCountryCode.flag}</Text>
          <Text className="text-base text-gray-700 mr-1">{selectedCountryCode.dialCode}</Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </Pressable>
        
        {/* Phone Number Input */}
        <TextInput
          className="flex-1 px-3 py-3 text-base"
          placeholder={placeholder}
          value={phone}
          onChangeText={onPhoneChange}
          onBlur={onValidate}
          keyboardType="phone-pad"
          placeholderTextColor="#A0AEC0"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
      </View>

      {/* Country Dropdown */}
      {countryDropdownVisible && (
        <View className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 z-50">
          <ScrollView showsVerticalScrollIndicator={false}>
            {COUNTRY_CODES.map((country) => (
              <Pressable
                key={country.code}
                className="flex-row items-center px-4 py-3 border-b border-gray-100"
                onPress={() => {
                  onCountryChange(country);
                  setCountryDropdownVisible(false);
                }}
              >
                <Text className="text-lg mr-3">{country.flag}</Text>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-800">{country.country}</Text>
                  <Text className="text-xs text-gray-500">{country.dialCode}</Text>
                </View>
                {selectedCountryCode.code === country.code && (
                  <Ionicons name="checkmark" size={16} color="#00BD5F" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Close dropdown when tapping outside */}
      {countryDropdownVisible && (
        <Pressable 
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}
          onPress={() => setCountryDropdownVisible(false)}
        />
      )}
    </View>
  );
};

const NameAndContact = () => {
  const { t } = useTranslation('(auth)/onboarding/name-contact');

  const router = useRouter();
  const { registrationData, setRegistrationData } = useRegistration();

  const [name, setName] = useState(registrationData.name);
  const [gender, setGender] = useState(registrationData.gender);
  const [email, setEmail] = useState(registrationData.email);
  const [phone, setPhone] = useState(registrationData.phone);
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>(
    COUNTRY_CODES.find(country => country.code === 'AE') || COUNTRY_CODES[0]
  ); // Default to UAE
  const [modalVisible, setModalVisible] = useState(false);
  const [countryDropdownVisible, setCountryDropdownVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    
    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
  };

  const validatePhone = () => {
    const validation = validatePhoneNumber(phone);
    if (!validation.isValid) {
      setPhoneError(validation.error || 'Invalid phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const isFormValid =
    name.trim().length > 0 &&
    isValidEmail(email) &&
    validatePhoneNumber(phone).isValid;

  const handleNext = () => {
    // Validate phone before proceeding
    if (!validatePhone()) {
      return;
    }

    setLoading(true);

    // Format the final phone number with country code
    const finalPhoneNumber = formatPhoneWithCountryCode(selectedCountryCode.dialCode, phone);

    setRegistrationData((prev: RegistrationData) => ({
      ...prev,
      name,
      gender,
      email,
      phone: finalPhoneNumber,
    }));

    // slight delay to show spinner before routing
    setTimeout(() => {
      router.push({
        pathname: '/onboarding/password',
        params: { email },
      });
      setLoading(false);
    }, 250);
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
          {t('title')}
          <Text className="text-brand italic"> {t('highlight')}</Text>
        </Text>

        {/* Name Input */}
        <View className="mb-4">
          <Text className="text-base font-semibold mb-1 text-gray-700">{t('nameLabel')}</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder={t('namePlaceholder')}
            value={name}
            onChangeText={setName}
            placeholderTextColor="#A0AEC0"
          />
        </View>

        {/* Gender Picker */}
        <View className="mb-4">
          <View className='flex-row items-center justify-between'>
            <Text className="text-base font-semibold mb-1 text-gray-700">{t('genderLabel')}</Text>
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
                    {t(`genderOptions.${option}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text
            onPress={toggleModal}
            className="text-brand text-sm mt-2 self-start"
          >
            {t('genderHelpLink')}
          </Text>
        </View>

        {/* Email Input */}
        <View className="mb-4">
          <Text className="text-base font-semibold mb-1 text-gray-700">{t('emailLabel')}</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder={t('emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#A0AEC0"
          />

          {/* Email validation error */}
          {email.length > 0 && !isValidEmail(email) && (
            <Text className="text-red-500 text-sm mt-1">{t('emailError')}</Text>
          )}
        </View>

        {/* Phone Input */}
        <View className="mb-6 relative">
          <Text className="text-base font-semibold mb-1 text-gray-700">{t('phoneLabel')}</Text>
          
          <PhoneInputWithCountryCode
            phone={phone}
            onPhoneChange={handlePhoneChange}
            onValidate={validatePhone}
            phoneError={phoneError}
            selectedCountryCode={selectedCountryCode}
            onCountryChange={setSelectedCountryCode}
            placeholder={t('phonePlaceholder')}
          />
          
          {/* Format Helper */}
          <Text className="text-gray-500 text-xs mt-1">
            {t('phoneHelp')}
          </Text>
          
          {/* Phone validation feedback */}
          {phoneError && (
            <Text className="text-red-500 text-sm mt-1">{t('phoneError')}</Text>
          )}
        </View>
      </View>

      {/* Bottom Button */}
      <Pressable
        className={`py-5 rounded-xl w-full flex items-center ${
          isFormValid && !loading ? 'bg-brand' : 'bg-gray-300'
        }`}
        disabled={!isFormValid || loading}
        onPress={handleNext}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-white font-semibold text-2xl">{t('next')}</Text>
        )}
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
            <Text className="text-lg font-bold mb-2">{t('modalTitle')}</Text>
            <Text className="text-gray-600 mb-4">
              {t('modalText')}
            </Text>
            <Pressable
              className="bg-brand px-4 py-2 rounded-lg self-end"
              onPress={toggleModal}
            >
              <Text className="text-white font-semibold">{t('modalButton')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default NameAndContact;