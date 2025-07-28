import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, I18nManager } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';
import * as Updates from 'expo-updates';
import { saveLanguage } from '../../../utils/languageStorage';
import auth from '@react-native-firebase/auth';

const Greeting = () => {
  const { t } = useTranslation('(auth)/onboarding/greeting');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>(i18n.language as 'en' | 'ar');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  useEffect(() => {
    setCurrentLanguage(i18n.language as 'en' | 'ar');
  }, [i18n.language]);

  const handleNext = () => {
    setLoading(true);
    setTimeout(() => {
      router.push('/onboarding/name-contact');
      setLoading(false);
    }, 250);
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLanguageChange = async (langCode: 'en' | 'ar') => {
    setCurrentLanguage(langCode);
    await saveLanguage(langCode);
    await i18n.changeLanguage(langCode);
    const isRTL = langCode === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      I18nManager.allowRTL(isRTL);
      Updates.reloadAsync();
    }
    setShowLanguageSelector(false);
  };

  return (
    <View className="flex-1 justify-around items-start bg-white p-8">
      {/* Language Selector Button - Top Right */}
      <View className="absolute top-[70px] right-8 z-10">
        <Pressable
          onPress={() => setShowLanguageSelector(!showLanguageSelector)}
          className="flex-row items-center bg-gray-100 rounded-full px-3 py-2"
        >
          <Ionicons name="language" size={20} color="#666" />
          <Text className="ml-2 text-gray-700 font-medium">
            {currentLanguage === 'en' ? 'EN' : 'عربي'}
          </Text>
          <Ionicons 
            name={showLanguageSelector ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#666" 
          />
        </Pressable>

        {/* Language Options Dropdown */}
        {showLanguageSelector && (
          <View className="absolute top-12 right-0 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[120px]">
            <Pressable
              onPress={() => handleLanguageChange('en')}
              className={`px-4 py-3 flex-row items-center justify-between ${
                currentLanguage === 'en' ? 'bg-green-50' : ''
              }`}
            >
              <Text className="text-gray-800">English</Text>
              {currentLanguage === 'en' && (
                <Ionicons name="checkmark" size={16} color="#00BD5F" />
              )}
            </Pressable>
            
            <View className="h-px bg-gray-200" />
            
            <Pressable
              onPress={() => handleLanguageChange('ar')}
              className={`px-4 py-3 flex-row items-center justify-between ${
                currentLanguage === 'ar' ? 'bg-green-50' : ''
              }`}
            >
              <Text className="text-gray-800">العربية</Text>
              {currentLanguage === 'ar' && (
                <Ionicons name="checkmark" size={16} color="#00BD5F" />
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* Heading Section */}
      <View>
        <Text className="text-6xl font-bold leading-[70px] tracking-wide">
          {t('welcome')}
          <Text className="text-brand text-7xl italic"> YallaGo</Text>
        </Text>

        <Text className="text-xl text-gray-600 pl-3 leading-[24px] mt-3">
          {t('subtitle')}
        </Text>
      </View>

      {/* Bottom Section */}
      <View className="w-full">
        <Pressable
          className={`px-6 py-5 rounded-xl w-full flex items-center ${
            !loading ? 'bg-brand' : 'bg-gray-300'
          }`}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text adjustsFontSizeToFit className="text-white font-semibold text-2xl">{t('next')}</Text>
          )}
        </Pressable>

        <View className="mt-6 flex-row justify-center items-center">
          <Text className="text-gray-600 text-base">{t('loginPrompt')} </Text>
          <Pressable onPress={handleLogin}>
            <Text adjustsFontSizeToFit className="text-brand font-semibold text-base underline">{t('loginButton')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default Greeting;