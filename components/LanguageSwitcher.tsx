import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { Globe, Check } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/constants/i18n';
import { Colors } from '@/constants/colors';

const LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'EN', nativeName: 'English' },
  { code: 'ku', name: 'کو', nativeName: 'کوردی' },
  { code: 'ar', name: 'عر', nativeName: 'العربية' },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setExpanded(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.globeButton}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Globe size={20} color="#D4AF37" strokeWidth={2.5} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.languageList}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageItem,
                language === lang.code && styles.languageItemActive,
              ]}
              onPress={() => handleLanguageSelect(lang.code)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.languageCode,
                language === lang.code && styles.languageCodeActive,
              ]}>
                {lang.name}
              </Text>
              {language === lang.code && (
                <Check size={14} color="#D4AF37" strokeWidth={3} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative' as const,
    zIndex: 9999,
  },
  globeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
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
        boxShadow: '0 2px 6px rgba(212, 175, 55, 0.3)',
      },
    }),
  },
  languageList: {
    position: 'absolute' as const,
    top: 42,
    left: 0,
    backgroundColor: 'rgba(26, 0, 0, 0.98)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D4AF37',
    overflow: 'hidden' as const,
    minWidth: 85,
    zIndex: 10000,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(212, 175, 55, 0.5)',
      },
    }),
  },
  languageItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  languageItemActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  languageCode: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.3,
  },
  languageCodeActive: {
    color: '#D4AF37',
  },
});
