// settings.tsx - Updated with Clear Recent Searches functionality
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Switch, ScrollView, Alert, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { clearRecentSearches } from '../../utils/recentSearchStorage';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import * as Updates from 'expo-updates';
import { saveLanguage } from '../../utils/languageStorage';

// Language configuration for UI display
const LANGUAGES = {
  en: { name: 'English', nativeName: 'English' },
  ar: { name: 'Arabic', nativeName: 'العربية' }
};

const SettingsScreen = () => {
  const { t } = useTranslation('profile/settings');

  const router = useRouter();
  
  // Simple state for UI toggles (no real functionality)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>(i18n.language as 'en' | 'ar');
  const [clearingSearches, setClearingSearches] = useState(false);

  useEffect(() => {
    setCurrentLanguage(i18n.language as 'en' | 'ar');
  }, [i18n.language]);


  const handleClearRecentSearches = async () => {
    Alert.alert(
      t('clearSearchAlertTitle'),
      t('clearSearchAlertMsg'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              setClearingSearches(true);
              await clearRecentSearches();
              Alert.alert(t('success'), t('clearSearchSuccess'));
            } catch (error) {
              console.error('Error clearing recent searches:', error);
              Alert.alert(t('error'), t('clearSearchError'));
            } finally {
              setClearingSearches(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Fixed Header */}
      <View className="px-6 pt-[70px] pb-4 bg-white">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
          <Text className="text-xl ml-4 font-bold font-[Afacad]">{t('title')}</Text>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Permissions Section */}
        <View className="mb-8 mt-4">
          <Text className="text-lg font-bold font-[Afacad] mb-4 text-gray-800">{t('permissions')}</Text>
          
          {/* Notifications */}
          <View className="bg-gray-50 rounded-lg p-4 mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="notifications" size={20} color="#00BD5F" />
                  <Text className="text-base font-[Afacad] font-semibold ml-2">{t('notifications')}</Text>
                </View>
                <Text className="text-sm font-[Afacad] text-gray-600">
                  {t('notificationsDesc')}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#D1D5DB', true: '#00BD5F' }}
                thumbColor={notificationsEnabled ? '#FFFFFF' : '#9CA3AF'}
                ios_backgroundColor="#D1D5DB"
              />
            </View>
          </View>

          {/* System Settings Link */}
          <Pressable onPress={() => console.log('Open system settings')}>
            <Text className="text-sm font-[Afacad] text-blue-600 text-center">
              {t('systemSettings')}
            </Text>
          </Pressable>
        </View>

        {/* Language Section */}
        <View className="mb-8">
          <Text className="text-lg font-bold font-[Afacad] mb-4 text-gray-800">{t('languageSection')}</Text>
          
          {Object.entries(LANGUAGES).map(([code, lang]) => (
            <Pressable
              key={code}
              onPress={async () => {
                const langCode = code as 'en' | 'ar';
                setCurrentLanguage(langCode);
                await saveLanguage(langCode);
                await i18n.changeLanguage(langCode);
                const isRTL = langCode === 'ar';
                if (I18nManager.isRTL !== isRTL) {
                  I18nManager.forceRTL(isRTL);
                  I18nManager.allowRTL(isRTL);
                  Updates.reloadAsync();
                }
              }}
              className={`bg-gray-50 rounded-lg p-4 mb-3 border-2 ${
                currentLanguage === code ? 'border-green-500 bg-green-50' : 'border-transparent'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-[Afacad] font-semibold text-gray-800">
                    {lang.name}
                  </Text>
                  <Text className="text-sm font-[Afacad] text-gray-600">
                    {lang.nativeName}
                  </Text>
                </View>
                {currentLanguage === code && (
                  <Ionicons name="checkmark-circle" size={24} color="#00BD5F" />
                )}
              </View>
            </Pressable>
          ))}
          
          <Text className="text-xs font-[Afacad] text-gray-500 mt-2 text-center">
            {t('restartNote')}
          </Text>
        </View>

        {/* Data & Privacy Section */}
        <View className="mb-8">
          <Text className="text-lg font-bold font-[Afacad] mb-4 text-gray-800">{t('dataPrivacy')}</Text>
          
          {/* Clear Recent Searches */}
          <Pressable 
            onPress={handleClearRecentSearches}
            disabled={clearingSearches}
            className={`bg-gray-50 rounded-lg p-4 mb-3 ${
              clearingSearches ? 'opacity-50' : ''
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="refresh" size={20} color="#FF6B6B" />
                  <Text className="text-base font-[Afacad] font-semibold ml-2">{t('clearSearch')}</Text>
                </View>
                <Text className="text-sm font-[Afacad] text-gray-600">
                  {t('clearSearchDesc')}
                </Text>
              </View>
              {clearingSearches ? (
                <View className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              )}
            </View>
          </Pressable>
        </View>

        {/* Additional Options */}
        <View className="mb-8">
          {/* Help & Support */}
          <Pressable 
            onPress={() => console.log('Help & Support pressed')}
            className="bg-gray-50 rounded-lg p-4 mb-3"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="help-circle" size={20} color="#666" />
                <Text className="text-base font-[Afacad] ml-3">{t('help')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;