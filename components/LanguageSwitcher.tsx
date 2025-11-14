import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/constants/i18n';

const LANGUAGES: { code: Language; display: string }[] = [
  { code: 'en', display: 'EN' },
  { code: 'ku', display: 'کو' },
  { code: 'ar', display: 'عر' },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const handleToggle = () => {
    const currentIndex = LANGUAGES.findIndex(l => l.code === language);
    const nextIndex = (currentIndex + 1) % LANGUAGES.length;
    setLanguage(LANGUAGES[nextIndex].code);
  };

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <TouchableOpacity 
      style={styles.button}
      onPress={handleToggle}
      activeOpacity={0.7}
    >
      <Text style={styles.text}>{currentLang.display}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(212, 175, 55, 0.2)',
      },
    }),
  },
  text: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
});
