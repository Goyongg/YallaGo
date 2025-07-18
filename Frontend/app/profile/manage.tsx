// Updated manage.tsx - Modified to include vehicle management for drivers
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import useHomeUserData from '@/hooks/useHomeUserData';

const ManageProfile = () => {
  const router = useRouter();
  const { userData, loading } = useHomeUserData();
  const [isDriver, setIsDriver] = useState(false);

  useEffect(() => {
    if (userData) {
      setIsDriver(userData.role === 'driver');
    }
  }, [userData]);

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
      'Are you sure you want to permanently delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Call backend for real delete logic
            console.log('Account deleted');
            Alert.alert('Account Deleted');
          },
        },
      ]
    );
  };

  const handleManageVehicles = () => {
    router.push('/profile/vehicles');
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="font-[Afacad]">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-6 pt-[70px]">
      {/* Header */}
      <View className="flex-row items-center mb-6">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
        <Text className="text-xl ml-4 font-bold font-[Afacad]">Manage Profile</Text>
      </View>

      {/* User Info */}
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

      {/* Driver-specific options - Removed fragment wrapper */}
      {isDriver && (
        <Pressable 
          onPress={handleManageVehicles} 
          className="flex-row items-center justify-between py-4 border-b border-gray-200"
        >
          <View className="flex-row items-center">
            <Ionicons name="car-outline" size={20} color="black" />
            <Text className="text-base text-black font-[Afacad] ml-3">
              Manage Vehicles
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="gray" />
        </Pressable>
      )}

      {/* Common options */}
      <Pressable 
        onPress={handleLogout} 
        className="flex-row items-center py-4 border-b border-gray-200"
      >
        <Ionicons name="log-out-outline" size={20} color="black" />
        <Text className="text-base text-black font-[Afacad] ml-3">
          Log Out
        </Text>
      </Pressable>

      <Pressable 
        onPress={handleDeleteAccount} 
        className="flex-row items-center py-4"
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        <Text className="text-base text-red-500 font-[Afacad] ml-3">
          Delete Account
        </Text>
      </Pressable>
    </View>
  );
};

export default ManageProfile;