// Enhanced manage.tsx - Added driving license field for drivers
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  Alert, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import useHomeUserData from '@/hooks/useHomeUserData';
import axios from 'axios';
import { BASE_URL } from '@/config';
import { validatePhoneNumber, COUNTRY_CODES, formatPhoneWithCountryCode, CountryCode } from '@/utils/validation';
import { useTranslation } from 'react-i18next';

interface ProfileData {
  name: string;
  email: string;
  phoneNumber: string;
  gender: string;
  kycStatus: string;
  licenseNumber?: string; // Added driving license field (backend field name)
}

const ManageProfile = () => {
  const { t } = useTranslation('profile/manage');

  const router = useRouter();
  const { userData, loading: userDataLoading, refetch } = useHomeUserData();
  const [isDriver, setIsDriver] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phoneNumber: '',
    gender: 'prefer_not_to_say',
    kycStatus: 'pending',
    licenseNumber: '' // Added driving license field (backend field name)
  });

  // Individual editing states
  const [editingField, setEditingField] = useState<keyof ProfileData | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  // Phone-specific states
  const [phoneError, setPhoneError] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>(
    COUNTRY_CODES.find(country => country.code === 'AE') || COUNTRY_CODES[0]
  );

  // Driving license validation state
  const [licenseError, setLicenseError] = useState('');

  const GENDER_OPTIONS = [
    { label: t('gender.male'), value: 'male' },
    { label: t('gender.female'), value: 'female' },
    { label: t('gender.preferNotToSay'), value: 'prefer_not_to_say' }
  ];

  // Driving License validation function
  const validateDrivingLicense = (license: string): { isValid: boolean; error?: string } => {
    const cleanLicense = license.trim();

    if (!cleanLicense) {
      return { isValid: true };
    }

    const normalizedLicense = cleanLicense.replace(/\s/g, '');
    const licenseRegex = /^\d+$/;
    
    if (!licenseRegex.test(normalizedLicense)) {
      return {
        isValid: false,
        error: t('validation.licenseOnlyNumbers')
      };
    }

    if (normalizedLicense.length < 5) {
      return {
        isValid: false,
        error: t('validation.licenseTooShort')
      };
    }

    if (normalizedLicense.length > 20) {
      return {
        isValid: false,
        error: t('validation.licenseTooLong')
      };
    }

    return { isValid: true };
  };

  // Reusable Phone Input Component for Manage Profile
  const PhoneInputForProfile = ({ 
    phone, 
    onPhoneChange, 
    onValidate, 
    phoneError, 
    selectedCountryCode, 
    onCountryChange
  }: {
    phone: string;
    onPhoneChange: (value: string) => void;
    onValidate: () => boolean;
    phoneError: string;
    selectedCountryCode: CountryCode;
    onCountryChange: (country: CountryCode) => void;
  }) => {
    const [countryDropdownVisible, setCountryDropdownVisible] = useState(false);

    return (
      <View className="relative">
        {/* Phone Input Container */}
        <View className={`flex-row border rounded-xl overflow-hidden ${
          phoneError ? 'border-red-300' : 'border-gray-200'
        }`}>
          {/* Country Code Selector */}
          <Pressable
            onPress={() => setCountryDropdownVisible(!countryDropdownVisible)}
            className="flex-row items-center px-3 py-3 bg-gray-50 border-r border-gray-200"
          >
            <Text className="text-base mr-1">{selectedCountryCode.flag}</Text>
            <Text className="text-sm text-gray-700 mr-1">{selectedCountryCode.dialCode}</Text>
            <Ionicons name="chevron-down" size={14} color="#6B7280" />
          </Pressable>
          
          {/* Phone Number Input */}
          <TextInput
            className="flex-1 px-3 py-3 text-base text-gray-800"
            placeholder={t('placeholders.phoneNumber')}
            value={phone}
            onChangeText={onPhoneChange}
            onBlur={onValidate}
            keyboardType="phone-pad"
            placeholderTextColor="#A0AEC0"
            returnKeyType="done"
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
                  <Text className="text-base mr-3">{country.flag}</Text>
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

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      refetch();
      hasFetchedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (userData) {
      setIsDriver(userData.role === 'driver');
      fetchProfileData();
    }
  }, [userData]);

  const fetchProfileData = async () => {
    try {
      const user = auth().currentUser;
      if (!user) return;

      const idToken = await user.getIdToken();
      const response = await axios.get(`${BASE_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const profile = response.data.user || response.data;
      setProfileData({
        name: profile.name || '',
        email: profile.email || user.email || '',
        phoneNumber: profile.phoneNumber || '',
        gender: profile.gender || 'prefer_not_to_say',
        kycStatus: profile.kycStatus || 'pending',
        licenseNumber: profile.licenseNumber || '' // Added driving license field (backend field name)
      });

      // Parse existing phone number to extract country code
      if (profile.phoneNumber) {
        const existingPhone = profile.phoneNumber;
        const matchedCountry = COUNTRY_CODES.find(country => 
          existingPhone.startsWith(country.dialCode)
        );
        if (matchedCountry) {
          setSelectedCountryCode(matchedCountry);
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      if (userData) {
        setProfileData({
          name: userData.name || '',
          email: auth().currentUser?.email || '',
          phoneNumber: '',
          gender: 'prefer_not_to_say',
          kycStatus: 'pending',
          licenseNumber: '' // Added driving license field (backend field name)
        });
      }
    }
  };

  const startEditing = (field: keyof ProfileData) => {
    setEditingField(field);
    if (field === 'phoneNumber') {
      // Extract local number without country code for editing
      const currentPhone = profileData[field];
      if (currentPhone.startsWith(selectedCountryCode.dialCode)) {
        setTempValue(currentPhone.replace(selectedCountryCode.dialCode, ''));
      } else {
        setTempValue(currentPhone);
      }
      setPhoneError('');
    } else {
      setTempValue(profileData[field] || '');
    }
    if (field === 'gender') {
      setShowGenderPicker(true);
    }
    if (field === 'licenseNumber') {
      setLicenseError('');
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValue('');
    setShowGenderPicker(false);
    setPhoneError('');
    setLicenseError('');
  };

  const handlePhoneChange = (value: string) => {
    setTempValue(value);
    if (phoneError) {
      setPhoneError('');
    }
  };

  const handleLicenseChange = (value: string) => {
    // Only allow digits
    const numericValue = value.replace(/[^0-9]/g, '');
    setTempValue(numericValue);
    if (licenseError) {
      setLicenseError('');
    }
  };

  const validatePhone = (): boolean => {
    const validation = validatePhoneNumber(tempValue);
    if (!validation.isValid) {
      setPhoneError(validation.error || 'Invalid phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validateLicense = (): boolean => {
    const validation = validateDrivingLicense(tempValue);
    if (!validation.isValid) {
      setLicenseError(validation.error || 'Invalid driving license');
      return false;
    }
    setLicenseError('');
    return true;
  };

  const validateField = (field: keyof ProfileData, value: string): boolean => {
    switch (field) {
      case 'name':
        if (!value.trim()) {
          Alert.alert(t('status.validationError'), t('validation.nameEmpty'));
          return false;
        }
        break;
      case 'email':
        if (!value.trim()) {
          Alert.alert(t('status.validationError'), t('validation.emailEmpty'));
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          Alert.alert(t('status.validationError'), t('validation.invalidEmail'));
          return false;
        }
        break;
      case 'phoneNumber':
        return validatePhone();
      case 'licenseNumber':
        return validateLicense();
    }
    return true;
  };

  const saveField = async (field: keyof ProfileData, value: string) => {
    if (!validateField(field, value)) return;

    try {
      setIsSaving(true);
      
      const user = auth().currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const idToken = await user.getIdToken();
      
      let finalValue: string | number = value;
      if (field === 'phoneNumber') {
        // Format phone with country code
        finalValue = formatPhoneWithCountryCode(selectedCountryCode.dialCode, value.trim());
      } else if (field === 'licenseNumber') {
        // Convert license number to number for backend
        finalValue = parseInt(value.trim(), 10);
        if (isNaN(finalValue)) {
          throw new Error('Invalid license number format');
        }
      }

      const updateData = {
        [field]: field === 'gender' ? value : finalValue
      };

      await axios.patch(
        `${BASE_URL}/users`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update local state
      setProfileData(prev => ({
        ...prev,
        [field]: finalValue
      }));

      setEditingField(null);
      setTempValue('');
      setShowGenderPicker(false);
      setPhoneError('');
      setLicenseError('');
      
      Alert.alert(t('status.success'), `${field.charAt(0).toUpperCase() + field.slice(1)} t('messages.updateSuccess'`);
      
      // Refresh user data
      refetch();
      
    } catch (error: any) {
      console.error(`Error updating ${field}:`, error);
      
      // Enhanced error logging for debugging
      console.error('Full error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data
        }
      });
      
      let errorMessage = `Failed to update ${field}`;
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data) {
        // If data is an object, stringify it
        errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(t('status.error'), errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const requestVerification = async () => {
    try {
      setIsSaving(true);
      
      const user = auth().currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const idToken = await user.getIdToken();
      
      const updateData = {
        kycStatus: 'verified'
      };

      await axios.patch(
        `${BASE_URL}/users`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update local state
      setProfileData(prev => ({
        ...prev,
        kycStatus: 'verified'
      }));
      
      Alert.alert('Success', 'Verification request submitted successfully! Your account is now verified.');
      
      // Refresh user data
      refetch();
      
    } catch (error: any) {
      console.error('Error requesting verification:', error);
      
      let errorMessage = 'Failed to submit verification request';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(t('status.error'), errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
      router.replace('/(auth)/onboarding/greeting');
    } catch (err) {
      console.error('Logout failed:', err);
      Alert.alert(t('status.error'), t('messages.logoutFailed'));
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) return; // Prevent multiple deletion attempts
    
    Alert.alert(
      t('confirmations.deleteAccountTitle'),
      t('confirmations.deleteAccountMessage'),
      [
        { text: t('confirmations.cancel'), style: 'cancel' },
        {
          text: t('confirmations.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeletingAccount(true);
              
              const user = auth().currentUser;
              if (!user) {
                setIsDeletingAccount(false);
                return;
              }

              const idToken = await user.getIdToken();
              
              // Delete user from backend first
              await axios.delete(`${BASE_URL}/users`, {
                headers: {
                  Authorization: `Bearer ${idToken}`,
                },
              });

              // Immediately sign out to prevent any further API calls with the token
              await auth().signOut();

              Alert.alert(t('confirmations.deleteAccountTitle'), t('messages.accountDeleted'));
              router.replace('/(auth)/onboarding/greeting');
              
            } catch (error) {
              console.error('Error deleting account:', error);
              
              // Even if backend deletion fails, we should still sign out
              // to prevent inconsistent state
              try {
                await auth().signOut();
                router.replace('/(auth)/onboarding/greeting');
              } catch (signOutError) {
                console.error('Error signing out after failed deletion:', signOutError);
              }
              
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } finally {
              setIsDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const handleManageVehicles = () => {
    router.push('/profile/vehicles');
  };

  const renderField = (
    field: keyof ProfileData,
    label: string,
    value: string,
    icon: string,
    keyboardType: 'default' | 'email-address' | 'phone-pad' | 'numeric' = 'default'
  ) => {
    const isEditing = editingField === field;
    const displayValue = value || t('status.notSet');

    if (field === 'phoneNumber') {
      return (
        <View className="mx-5 py-5 border-b border-gray-50">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center mr-4">
                <Ionicons name={icon as any} size={18} color="#6B7280" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold font-[Afacad] text-gray-500 mb-1">{label}</Text>
                {isEditing ? (
                  <View className="mt-2">
                    <PhoneInputForProfile
                      phone={tempValue}
                      onPhoneChange={handlePhoneChange}
                      onValidate={validatePhone}
                      phoneError={phoneError}
                      selectedCountryCode={selectedCountryCode}
                      onCountryChange={setSelectedCountryCode}
                    />
                    {phoneError && (
                      <Text className="text-red-500 text-sm mt-1">{phoneError}</Text>
                    )}
                    <View className="flex-row gap-3 mt-3">
                      <Pressable
                        className="px-4 py-2 bg-gray-100 rounded-lg"
                        onPress={cancelEditing}
                        disabled={isSaving}
                      >
                        <Text className="text-sm font-semibold font-[Afacad] text-gray-600">{t('actions.cancel')}</Text>
                      </Pressable>
                      <Pressable
                        className={`px-4 py-2 rounded-lg flex-row items-center ${
                          !phoneError && tempValue.trim() ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        onPress={() => saveField(field, tempValue)}
                        disabled={isSaving || !!phoneError || !tempValue.trim()}
                      >
                        {isSaving ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text className="text-sm font-semibold font-[Afacad] text-white">{t('actions.save')}</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Text className="text-base font-[Afacad] text-gray-800">
                    {displayValue}
                  </Text>
                )}
              </View>
            </View>
            
            {!isEditing && (
              <Pressable 
                onPress={() => startEditing(field)} 
                disabled={isSaving}
                className="w-8 h-8 rounded-full bg-green-50 justify-center items-center"
              >
                <Ionicons name="create-outline" size={16} color="#00BD5F" />
              </Pressable>
            )}
          </View>
        </View>
      );
    }

    if (field === 'licenseNumber') {
      return (
        <View className="mx-5 py-5 border-b border-gray-50">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center mr-4">
                <Ionicons name={icon as any} size={18} color="#6B7280" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold font-[Afacad] text-gray-500 mb-1">{label}</Text>
                {isEditing ? (
                  <View className="mt-2">
                    <TextInput
                      className="bg-gray-50 p-3 rounded-xl border border-gray-200 font-[Afacad] text-base text-gray-800"
                      value={tempValue}
                      onChangeText={handleLicenseChange}
                      onBlur={validateLicense}
                      placeholder={t('placeholders.drivingLicense')}
                      keyboardType="numeric"
                      autoFocus
                      placeholderTextColor="#A0AEC0"
                    />
                    {licenseError && (
                      <Text className="text-red-500 text-sm mt-1">{licenseError}</Text>
                    )}
                    <View className="flex-row gap-3 mt-3">
                      <Pressable
                        className="px-4 py-2 bg-gray-100 rounded-lg"
                        onPress={cancelEditing}
                        disabled={isSaving}
                      >
                        <Text className="text-sm font-semibold font-[Afacad] text-gray-600">{t('actions.cancel')}</Text>
                      </Pressable>
                      <Pressable
                        className={`px-4 py-2 rounded-lg flex-row items-center ${
                          !licenseError ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        onPress={() => saveField(field, tempValue)}
                        disabled={isSaving || !!licenseError}
                      >
                        {isSaving ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text className="text-sm font-semibold font-[Afacad] text-white">{t('actions.save')}</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Text className="text-base font-[Afacad] text-gray-800">
                    {displayValue}
                  </Text>
                )}
              </View>
            </View>
            
            {!isEditing && (
              <Pressable 
                onPress={() => startEditing(field)} 
                disabled={isSaving}
                className="w-8 h-8 rounded-full bg-green-50 justify-center items-center"
              >
                <Ionicons name="create-outline" size={16} color="#00BD5F" />
              </Pressable>
            )}
          </View>
        </View>
      );
    }

    if (field === 'gender') {
      const genderLabel = GENDER_OPTIONS.find(opt => opt.value === value)?.label || 'Not set';
      
      return (
        <View className="mx-5 py-5 border-b border-gray-50">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center mr-4">
                <Ionicons name={icon as any} size={18} color="#6B7280" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold font-[Afacad] text-gray-500 mb-1">{label}</Text>
                {isEditing ? (
                  <View className="mt-2">
                    {showGenderPicker && (
                      <View className="bg-gray-50 rounded-xl border border-gray-200 mb-3 overflow-hidden">
                        {GENDER_OPTIONS.map((option, index) => (
                          <Pressable
                            key={option.value}
                            className={`p-4 flex-row justify-between items-center ${
                              index < GENDER_OPTIONS.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                            onPress={() => {
                              setTempValue(option.value);
                              setShowGenderPicker(false);
                              saveField(field, option.value);
                            }}
                          >
                            <Text className="font-[Afacad] text-gray-800 text-base">
                              {option.label}
                            </Text>
                            {tempValue === option.value && (
                              <View className="w-5 h-5 rounded-full bg-green-500 justify-center items-center">
                                <Ionicons name="checkmark" size={12} color="white" />
                              </View>
                            )}
                          </Pressable>
                        ))}
                      </View>
                    )}
                    <View className="flex-row gap-3">
                      <Pressable
                        className="px-4 py-2 bg-gray-100 rounded-lg"
                        onPress={cancelEditing}
                        disabled={isSaving}
                      >
                        <Text className="text-sm font-semibold font-[Afacad] text-gray-600">{t('actions.cancel')}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Text className="text-base font-[Afacad] text-gray-800 capitalize">
                    {genderLabel}
                  </Text>
                )}
              </View>
            </View>
            
            {!isEditing && (
              <Pressable 
                onPress={() => startEditing(field)} 
                disabled={isSaving}
                className="w-8 h-8 rounded-full bg-green-50 justify-center items-center"
              >
                <Ionicons name="create-outline" size={16} color="#00BD5F" />
              </Pressable>
            )}
          </View>
        </View>
      );
    }

    return (
      <View className="mx-5 py-5 border-b border-gray-50">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center mr-4">
              <Ionicons name={icon as any} size={18} color="#6B7280" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold font-[Afacad] text-gray-500 mb-1">{label}</Text>
              {isEditing ? (
                <View className="mt-2">
                  <TextInput
                    className="bg-gray-50 p-3 rounded-xl border border-gray-200 font-[Afacad] text-base text-gray-800"
                    value={tempValue}
                    onChangeText={setTempValue}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    keyboardType={keyboardType}
                    autoCapitalize={field === 'name' ? 'words' : 'none'}
                    autoFocus
                  />
                  <View className="flex-row gap-3 mt-3">
                    <Pressable
                      className="px-4 py-2 bg-gray-100 rounded-lg"
                      onPress={cancelEditing}
                      disabled={isSaving}
                    >
                      <Text className="text-sm font-semibold font-[Afacad] text-gray-600">{t('actions.cancel')}</Text>
                    </Pressable>
                    <Pressable
                      className="px-4 py-2 bg-green-500 rounded-lg flex-row items-center"
                      onPress={() => saveField(field, tempValue)}
                      disabled={isSaving || tempValue === value}
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-sm font-semibold font-[Afacad] text-white">{t('actions.save')}</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Text className="text-base font-[Afacad] text-gray-800">
                  {displayValue}
                </Text>
              )}
            </View>
          </View>
          
          {!isEditing && (
            <Pressable 
              onPress={() => startEditing(field)} 
              disabled={isSaving}
              className="w-8 h-8 rounded-full bg-green-50 justify-center items-center"
            >
              <Ionicons name="create-outline" size={16} color="#00BD5F" />
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  if (userDataLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="font-[Afacad] mt-2">{t('loading')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="flex-1 px-6 pt-[70px]" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
          <Text className="text-xl ml-4 font-bold font-[Afacad]">{t('title')}</Text>
        </View>

        {/* User Info Display (Original Design) */}
        <View className="bg-gray-50 p-4 rounded-lg mb-6">
          <Text className="text-lg font-bold font-[Afacad] mb-1">
            {userData?.name}
          </Text>
          <Text className="text-gray-600 font-[Afacad] capitalize">
            {userData?.role}
          </Text>
          {typeof userData?.averageRating === 'number' && (
            <View className="flex-row items-center mt-2">
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text className="text-gray-600 ml-1 font-[Afacad]">
                {userData.averageRating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Editable Profile Fields */}
        <View className="bg-white rounded-2xl p-1 mb-8 shadow-sm border border-gray-100">
          <Text className="text-lg font-bold font-[Afacad] mb-6 px-5 pt-5 text-gray-800">{t('profileInformation')}</Text>
          
          {renderField('name', t('fields.name'), profileData.name, 'person-outline')}
          {renderField('email', t('fields.email'), profileData.email, 'mail-outline', 'email-address')}
          {renderField('phoneNumber', t('fields.phoneNumber'), profileData.phoneNumber, 'call-outline', 'phone-pad')}
          {renderField('gender', t('fields.gender'), profileData.gender, 'people-outline')}
          
          {/* Driving License Field - Only show for drivers */}
          {isDriver && renderField('licenseNumber', t('fields.drivingLicense'), profileData.licenseNumber || '', 'card-outline', 'numeric')}
          
          {/* Verification Section */}
          <View className="mx-5 py-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center mr-4">
                  <Ionicons name="shield-checkmark-outline" size={18} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold font-[Afacad] text-gray-500 mb-1">{t('verification.status')}</Text>
                  <View className="flex-row items-center">
                    <View className={`px-3 py-1 rounded-full ${
                      profileData.kycStatus === 'verified' ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      <Text className={`text-sm font-semibold font-[Afacad] capitalize ${
                        profileData.kycStatus === 'verified' ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {profileData.kycStatus === 'verified' ? t('verification.verified') : t('verification.pending')}
                      </Text>
                    </View>
                    {profileData.kycStatus === 'verified' && (
                      <View className="ml-2">
                        <Ionicons name="checkmark-circle" size={16} color="#00BD5F" />
                      </View>
                    )}
                  </View>
                </View>
              </View>
              
              {profileData.kycStatus !== 'verified' && (
                <Pressable 
                  onPress={requestVerification}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-500 rounded-lg flex-row items-center"
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={14} color="white" />
                      <Text className="text-sm font-semibold font-[Afacad] text-white ml-1">
                        {t('verification.requestVerification')}
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Management Options */}
        <View className="bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
          <Text className="text-lg font-bold font-[Afacad] mb-6 px-5 pt-5 text-gray-800">{t('accountManagement')}</Text>
          
          {/* Driver-specific options */}
          {isDriver && (
            <View className="mx-5 py-4 border-b border-gray-50">
              <Pressable 
                onPress={handleManageVehicles} 
                className="flex-row items-center"
              >
                <View className="w-10 h-10 rounded-full bg-green-50 justify-center items-center mr-4">
                  <Ionicons name="car-outline" size={18} color="#00BD5F" />
                </View>
                <Text className="text-base text-gray-800 font-semibold font-[Afacad] flex-1">
                  {t('manageVehicles')}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </Pressable>
            </View>
          )}

          {/* Common options */}
          <View className="mx-5 py-4 border-b border-gray-50">
            <Pressable 
              onPress={handleLogout} 
              className="flex-row items-center"
            >
              <View className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center mr-4">
                <Ionicons name="log-out-outline" size={18} color="#6B7280" />
              </View>
              <Text className="text-base text-gray-800 font-semibold font-[Afacad] flex-1">
                {t('actions.logout')}
              </Text>
            </Pressable>
          </View>

          <View className="mx-5 py-4">
            <Pressable 
              onPress={handleDeleteAccount} 
              disabled={isDeletingAccount || isSaving}
              className={`flex-row items-center ${isDeletingAccount ? 'opacity-50' : ''}`}
            >
              <View className="w-10 h-10 rounded-full bg-red-50 justify-center items-center mr-4">
                {isDeletingAccount ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                )}
              </View>
              <Text className="text-base text-red-500 font-semibold font-[Afacad] flex-1">
                {isDeletingAccount ? t('actions.deletingAccount') : t('actions.deleteAccount')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom padding for keyboard and screen edge */}
        <View className="h-32" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ManageProfile;