import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors } from '@/constants/colors';
import { Language } from '@/constants/i18n';




const LANGUAGES = [
  { code: 'ku' as Language, label: 'کوردی', subtitle: 'NRT' },
  { code: 'en' as Language, label: 'English', subtitle: 'ENG' },
  { code: 'ar' as Language, label: 'عربي', subtitle: 'AR' },
];

export default function LandingPage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const insets = useSafeAreaInsets();
  const [dimensions, setDimensions] = React.useState(() => Dimensions.get('window'));

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const { width } = dimensions;
  const isSmallScreen = width < 380;

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLang(lang);
  };

  const handleContinue = async () => {
    await setLanguage(selectedLang);
    router.replace('/menu');
  };

  const handleStaffLogin = () => {
    router.push('/staff-login');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={['#3D0101', '#4D1515', '#3D0101']}
        style={styles.gradient}
      >
        <View style={[styles.content, isSmallScreen && styles.contentSmall]}>
          <Image
            source={require('@/assets/images/adaptive-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>تەپسی سلێمانی</Text>
          <Text style={styles.subtitle}>تامو چێژێکی رەسەنی کوردی لە تەپسی سلێمانی بچێژە</Text>
          
          <View style={styles.languageContainer}>
            <Text style={styles.languagePrompt}>زمانەکەت هەڵبژێرە</Text>
            <Text style={styles.languageSubPrompt}>Select Your Language • اختر لغتك</Text>

            <View style={[styles.languageGrid, isSmallScreen && styles.languageGridSmall]}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageCard,
                    selectedLang === lang.code && styles.languageCardActive,
                    isSmallScreen && styles.languageCardSmall,
                  ]}
                  onPress={() => handleLanguageSelect(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.languageLabel,
                    selectedLang === lang.code && styles.languageLabelActive,
                  ]}>
                    {lang.label}
                  </Text>
                  <Text style={[
                    styles.languageSubtitle,
                    selectedLang === lang.code && styles.languageSubtitleActive,
                  ]}>
                    {lang.subtitle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueText}>Continue to Menu</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.staffButton}
            onPress={handleStaffLogin}
            activeOpacity={0.7}
          >
            <User size={24} color={Colors.gold} />
            <Text style={styles.staffButtonText}>Staff Access</Text>
          </TouchableOpacity>

          <Image
            source={require('@/assets/images/adaptive-icon.png')}
            style={styles.bottomLogo}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>تەپسی سلێمانی</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3D0101',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 440,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  contentSmall: {
    paddingHorizontal: 16,
    maxWidth: 360,
  },
  staffButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    width: '100%',
    marginBottom: 40,
  },
  staffButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.gold,
  },
  bottomLogo: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: Colors.gold,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: '#E5E5E5',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  languageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  languagePrompt: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  languageSubPrompt: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  languageGrid: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    marginBottom: 40,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  languageGridSmall: {
    gap: 12,
  },
  languageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 24,
    paddingHorizontal: 20,
    flex: 1,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageCardSmall: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    minWidth: 80,
  },
  languageCardActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: Colors.gold,
    borderWidth: 3,
  },
  languageLabel: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  languageLabelActive: {
    color: Colors.gold,
  },
  languageSubtitle: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  languageSubtitleActive: {
    color: 'rgba(212, 175, 55, 0.8)',
  },
  continueButton: {
    backgroundColor: Colors.gold,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#3D0101',
    letterSpacing: 0.5,
  },
});
