import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';

const ManageProfile = () => {
  const router = useRouter();

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

  return (
    <View className="flex-1 bg-white px-6 pt-[70px]">
      {/* Header */}
      <View className="flex-row items-center mb-6">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
        <Text className="text-xl ml-4 font-bold font-[Afacad]">Manage Profile</Text>
      </View>

      {/* Logout */}
      <Pressable onPress={handleLogout} className="py-4 border-b border-gray-200">
        <Text className="text-base text-black font-[Afacad]">Log Out</Text>
      </Pressable>

      {/* Delete Account */}
      <Pressable onPress={handleDeleteAccount} className="py-4">
        <Text className="text-base text-red-500 font-[Afacad]">Delete Account</Text>
      </Pressable>
    </View>
  );
};

export default ManageProfile;
