import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const HistoryScreen = () => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white px-6 pt-[70px]">
      <View className="flex-row items-center mb-6">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
        <Text className="text-xl ml-4 font-bold font-[Afacad]">History</Text>
      </View>
    </View>
  );
};

export default HistoryScreen;
