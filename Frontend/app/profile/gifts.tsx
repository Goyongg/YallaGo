import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

const GiftsScreen = () => {
  const { t } = useTranslation('profile/gifts');

  const router = useRouter();

  return (
    <View className="flex-1 bg-white px-6 pt-[70px]">
      <View className="flex-row items-center mb-6">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
        <Text className="text-xl ml-4 font-bold font-[Afacad]">{t('title')}</Text>
      </View>

      {/* No Offers Available Message */}
      <View className="flex-1 justify-center items-center px-4">
        <View className="items-center">
          <Ionicons name="gift-outline" size={80} color="#9CA3AF" />
          <Text className="text-xl font-bold font-[Afacad] text-gray-800 mt-6 text-center">
            {t('noOffers.title')}
          </Text>
          <Text className="text-gray-600 font-[Afacad] text-center mt-2 leading-6">
            {t('noOffers.subtitle')}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default GiftsScreen;