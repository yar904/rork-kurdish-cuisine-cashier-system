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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    justifyContent: 'center' as const,
    minWidth: 50,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
      },
    }),
  },
  text: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#D4AF37',
    letterSpacing: 0.3,
    textAlign: 'center' as const,
    minWidth: 24,
  },
});
