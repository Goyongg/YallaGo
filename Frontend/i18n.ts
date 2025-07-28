import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import { I18nManager } from 'react-native';
import en from './translations/en';
import ar from './translations/ar';
import { getSavedLanguage } from './utils/languageStorage';
import * as Updates from 'expo-updates';

const fallbackLng = 'en';
const resources = { en, ar };

let alreadyHandledRTL = false;

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (cb: (lang: string) => void) => {
    const savedLang = await getSavedLanguage();
    const lang = savedLang && Object.keys(resources).includes(savedLang)
      ? savedLang
      : RNLocalize.getLocales()[0]?.languageCode || fallbackLng;

    const isRTL = lang === 'ar';

    // ❗ Only force RTL if needed and not yet handled
    if (!alreadyHandledRTL && I18nManager.isRTL !== isRTL) {
      alreadyHandledRTL = true;
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
      Updates.reloadAsync(); // force app reload to apply RTL
      return;
    }

    cb(lang);
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

i18n
  .use(languageDetector as any)
  .use(initReactI18next)
  .init({
    fallbackLng,
    resources,
    interpolation: { escapeValue: false },
  });

export default i18n;
