// Enhanced manage.tsx - Individual field editing with verification feature
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

interface ProfileData {
  name: string;
  email: string;
  phoneNumber: string;
  gender: string;
  kycStatus: string;
}

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' }
];

const ManageProfile = () => {
  const router = useRouter();
  const { userData, loading: userDataLoading, refetch } = useHomeUserData();
  const [isDriver, setIsDriver] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phoneNumber: '',
    gender: 'prefer_not_to_say',
    kycStatus: 'pending'
  });

  // Individual editing states
  const [editingField, setEditingField] = useState<keyof ProfileData | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

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
        kycStatus: profile.kycStatus || 'pending'
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
      if (userData) {
        setProfileData({
          name: userData.name || '',
          email: auth().currentUser?.email || '',
          phoneNumber: '',
          gender: 'prefer_not_to_say',
          kycStatus: 'pending'
        });
      }
    }
  };

  const startEditing = (field: keyof ProfileData) => {
    setEditingField(field);
    setTempValue(profileData[field]);
    if (field === 'gender') {
      setShowGenderPicker(true);
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValue('');
    setShowGenderPicker(false);
  };

  const validateField = (field: keyof ProfileData, value: string): boolean => {
    switch (field) {
      case 'name':
        if (!value.trim()) {
          Alert.alert('Validation Error', 'Name cannot be empty');
          return false;
        }
        break;
      case 'email':
        if (!value.trim()) {
          Alert.alert('Validation Error', 'Email cannot be empty');
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          Alert.alert('Validation Error', 'Please enter a valid email address');
          return false;
        }
        break;
      case 'phoneNumber':
        if (!value.trim()) {
          Alert.alert('Validation Error', 'Phone number cannot be empty');
          return false;
        }
        break;
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
      
      const updateData = {
        [field]: field === 'gender' ? value : value.trim()
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
        [field]: field === 'gender' ? value : value.trim()
      }));

      setEditingField(null);
      setTempValue('');
      setShowGenderPicker(false);
      
      Alert.alert('Success', `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
      
      // Refresh user data
      refetch();
      
    } catch (error: any) {
      console.error(`Error updating ${field}:`, error);
      
      let errorMessage = `Failed to update ${field}`;
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
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
      
      Alert.alert('Error', errorMessage);
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
      Alert.alert('Error', 'Could not log out. Try again.');
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth().currentUser;
              if (!user) return;

              const idToken = await user.getIdToken();
              await axios.delete(`${BASE_URL}/users`, {
                headers: {
                  Authorization: `Bearer ${idToken}`,
                },
              });

              Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
              router.replace('/(auth)/onboarding/greeting');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
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
    keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default'
  ) => {
    const isEditing = editingField === field;
    const displayValue = value || 'Not set';

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
                        <Text className="text-sm font-semibold font-[Afacad] text-gray-600">Cancel</Text>
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
                      <Text className="text-sm font-semibold font-[Afacad] text-gray-600">Cancel</Text>
                    </Pressable>
                    <Pressable
                      className="px-4 py-2 bg-green-500 rounded-lg flex-row items-center"
                      onPress={() => saveField(field, tempValue)}
                      disabled={isSaving || tempValue === value}
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-sm font-semibold font-[Afacad] text-white">Save</Text>
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
        <Text className="font-[Afacad] mt-2">Loading...</Text>
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
          <Text className="text-xl ml-4 font-bold font-[Afacad]">Manage Profile</Text>
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
          <Text className="text-lg font-bold font-[Afacad] mb-6 px-5 pt-5 text-gray-800">Profile Information</Text>
          
          {renderField('name', 'Name', profileData.name, 'person-outline')}
          {renderField('email', 'Email', profileData.email, 'mail-outline', 'email-address')}
          {renderField('phoneNumber', 'Phone Number', profileData.phoneNumber, 'call-outline', 'phone-pad')}
          {renderField('gender', 'Gender', profileData.gender, 'people-outline')}
          
          {/* Verification Section */}
          <View className="mx-5 py-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center mr-4">
                  <Ionicons name="shield-checkmark-outline" size={18} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold font-[Afacad] text-gray-500 mb-1">Verification Status</Text>
                  <View className="flex-row items-center">
                    <View className={`px-3 py-1 rounded-full ${
                      profileData.kycStatus === 'verified' ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      <Text className={`text-sm font-semibold font-[Afacad] capitalize ${
                        profileData.kycStatus === 'verified' ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {profileData.kycStatus === 'verified' ? 'Verified' : 'Pending'}
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
                        Request Verification
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
          <Text className="text-lg font-bold font-[Afacad] mb-6 px-5 pt-5 text-gray-800">Account Management</Text>
          
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
                  Manage Vehicles
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
                Log Out
              </Text>
            </Pressable>
          </View>

          <View className="mx-5 py-4">
            <Pressable 
              onPress={handleDeleteAccount} 
              className="flex-row items-center"
            >
              <View className="w-10 h-10 rounded-full bg-red-50 justify-center items-center mr-4">
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </View>
              <Text className="text-base text-red-500 font-semibold font-[Afacad] flex-1">
                Delete Account
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