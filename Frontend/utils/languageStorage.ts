import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'yallago-language';

export const saveLanguage = async (lang: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch (err) {
    console.error('Error saving language', err);
  }
};

export const getSavedLanguage = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch (err) {
    console.error('Error loading saved language', err);
    return null;
  }
};
