import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Instagram } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors, fonts } from '@/constants/colors';
import { Language } from '@/constants/i18n';

const LANGUAGES = [
  { code: 'ku' as Language, label: 'کوردی' },
  { code: 'en' as Language, label: 'English' },
  { code: 'ar' as Language, label: 'عربي' },
];

export default function LandingPage() {
  const router = useRouter();
  const { language, setLanguage, isLoading } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const [showLanguages, setShowLanguages] = useState(false);
  const insets = useSafeAreaInsets();

  const handleLanguageSelect = async (lang: Language) => {
    setSelectedLang(lang);
    await setLanguage(lang);
    setShowLanguages(false);
  };

  const handleContinue = () => {
    router.replace('/menu');
  };

  React.useEffect(() => {
    if (!isLoading) {
      setSelectedLang(language);
    }
  }, [language, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </View>
    );
  }

  const currentLanguage = LANGUAGES.find(l => l.code === selectedLang);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800' }}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0.95)']}
          style={styles.overlay}
        >
          <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity 
              style={styles.languageButton}
              onPress={() => setShowLanguages(!showLanguages)}
              activeOpacity={0.8}
            >
              <Text style={styles.languageButtonText}>{currentLanguage?.label}</Text>
            </TouchableOpacity>
          </View>

          {showLanguages && (
            <View style={[styles.languageDropdown, { top: insets.top + 60 }]}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    selectedLang === lang.code && styles.languageOptionActive,
                  ]}
                  onPress={() => handleLanguageSelect(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.languageOptionText,
                    selectedLang === lang.code && styles.languageOptionTextActive,
                  ]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleContinue}
              activeOpacity={0.85}
            >
              <Text style={styles.menuButtonText}>مینۆ</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialButton}
              activeOpacity={0.7}
            >
              <Instagram size={28} color="#FFFFFF" strokeWidth={1.5} />
            </TouchableOpacity>

            <Text style={styles.tagline}>بەشێکی، کراوە لەلایەن</Text>
            <Text style={styles.brandText}>mynu</Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  languageButton: {
    backgroundColor: 'rgba(139, 69, 19, 0.85)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  languageButtonText: {
    fontFamily: fonts.kurdishBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  languageDropdown: {
    position: 'absolute',
    left: 20,
    backgroundColor: 'rgba(139, 69, 19, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    zIndex: 100,
  },
  languageOption: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  languageOptionActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  languageOptionText: {
    fontFamily: fonts.kurdish,
    fontSize: 15,
    color: '#FFFFFF',
  },
  languageOptionTextActive: {
    fontFamily: fonts.kurdishBold,
    color: Colors.gold,
  },
  bottomSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  menuButton: {
    backgroundColor: 'rgba(139, 69, 19, 0.85)',
    paddingVertical: 18,
    paddingHorizontal: 80,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
    maxWidth: 400,
  },
  menuButtonText: {
    fontFamily: fonts.kurdishBold,
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  socialButton: {
    marginBottom: 16,
    padding: 8,
  },
  tagline: {
    fontFamily: fonts.kurdish,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
    textAlign: 'center',
  },
  brandText: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: Colors.gold,
    textAlign: 'center',
  },
});
