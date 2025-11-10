import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { Check } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/constants/i18n';
import { Colors } from '@/constants/colors';

interface LanguageSwitcherProps {
  visible: boolean;
  onClose: () => void;
  style?: any;
}

const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'EN', flag: '🇬🇧' },
  { code: 'ku', name: 'KU', flag: '🟢🔴' },
  { code: 'ar', name: 'AR', flag: '🇸🇦' },
];

export default function LanguageSwitcher({ visible, onClose, style }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.dropdown, style]}>
          {LANGUAGES.map((lang, index) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageItem,
                language === lang.code && styles.languageItemActive,
                index === 0 && styles.firstItem,
                index === LANGUAGES.length - 1 && styles.lastItem,
              ]}
              onPress={() => handleLanguageSelect(lang.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text style={[
                styles.languageName,
                language === lang.code && styles.languageNameActive,
              ]}>
                {lang.name}
              </Text>
              {language === lang.code && (
                <Check size={14} color={Colors.primary} strokeWidth={3} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 60,
    paddingLeft: 16,
    alignItems: 'flex-start',
  },
  dropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    minWidth: 110,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
      } as any,
    }),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  firstItem: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  languageItemActive: {
    backgroundColor: Colors.backgroundGray,
  },
  flag: {
    fontSize: 18,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  languageNameActive: {
    color: Colors.primary,
    fontWeight: '700' as const,
  },
});
