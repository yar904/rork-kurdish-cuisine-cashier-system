import { useState, useCallback, useMemo, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, translations, categoryTranslations } from '@/constants/i18n';

const LANGUAGE_STORAGE_KEY = '@tapse_language';

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguageState] = useState<Language>('ku');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && (stored === 'en' || stored === 'ku' || stored === 'ar')) {
        setLanguageState(stored as Language);
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    }
    setIsLoading(false);
  };

  const setLanguage = useCallback(async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  }, []);

  const t = useCallback((key: keyof typeof translations.en): string => {
    return translations[language][key] || translations.en[key] || key;
  }, [language]);

  const tc = useCallback((category: string): string => {
    return categoryTranslations[language][category as keyof typeof categoryTranslations.en] || category;
  }, [language]);

  return useMemo(() => ({
    language,
    setLanguage,
    t,
    tc,
    isLoading,
  }), [language, setLanguage, t, tc, isLoading]);
});
