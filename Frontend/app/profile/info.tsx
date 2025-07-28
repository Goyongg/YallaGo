import React from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';

const InfoScreen = () => {
  const { t } = useTranslation('profile/info');

  const router = useRouter();

  // App version and build info - you can get these from your app.json or package.json
  const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
  const BUILD_NUMBER = "13";
  const BUILD_DATE = "2025-01-28";

  const handleLicensePress = () => {
    // Navigate to license agreement screen or open modal
    // router.push('/license');
    console.log('License Agreement pressed');
  };

  const handlePrivacyPress = () => {
    // Navigate to privacy policy screen or open modal
    // router.push('/privacy');
    console.log('Privacy Policy pressed');
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 pt-[70px]">
        {/* Header */}
        <View className="flex-row items-center mb-8">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
          <Text className="text-xl ml-4 font-bold font-[Afacad]">{t('title')}</Text>
        </View>

        {/* App Logo and Info Section */}
        <View className="items-center mb-8">
          {/* Logo - Replace with your actual logo */}
          <View className="w-20 h-20 bg-green-500 rounded-full items-center justify-center mb-4">
            <Ionicons name="information-circle" size={40} color="white" />
          </View>
          
          {/* App Name */}
          <Text className="text-2xl font-bold font-[Afacad] text-gray-800 mb-2">
            YallaGo
          </Text>
          
          {/* Version Info */}
          <View className="items-center space-y-1">
            <Text className="text-lg font-medium font-[Afacad] text-gray-600">
              {t('version.label', { version: APP_VERSION })}
            </Text>
            <Text className="text-sm font-[Afacad] text-gray-500">
              {t('build.label', { build: BUILD_NUMBER })}
            </Text>
            <Text className="text-sm font-[Afacad] text-gray-500">
              {BUILD_DATE}
            </Text>
          </View>
        </View>

        {/* Sections */}
        <View className="space-y-4 gap-2">
          {/* License Agreement Section */}
          <Pressable 
            onPress={handleLicensePress}
            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="document-text-outline" size={24} color="#374151" />
                <View className="ml-3">
                  <Text className="text-lg font-semibold font-[Afacad] text-gray-800">
                    {t('license.title')}
                  </Text>
                  <Text className="text-sm font-[Afacad] text-gray-500">
                    {t('license.subtitle')}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </Pressable>

          {/* Privacy Policy Section */}
          <Pressable 
            onPress={handlePrivacyPress}
            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="shield-checkmark-outline" size={24} color="#374151" />
                <View className="ml-3">
                  <Text className="text-lg font-semibold font-[Afacad] text-gray-800">
                    {t('privacy.title')}
                  </Text>
                  <Text className="text-sm font-[Afacad] text-gray-500">
                    {t('privacy.subtitle')}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          </Pressable>
        </View>

        {/* Additional Info Section (Optional) */}
        <View className="mt-8 mb-6">
          <Text className="text-center text-sm font-[Afacad] text-gray-400">
            © 2025 Nexora Tech. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default InfoScreen;