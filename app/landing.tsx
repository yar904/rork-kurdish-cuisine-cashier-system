import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
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
  { code: 'ku' as Language, label: 'کوردی', subtitle: 'کوردی', isPrimary: true },
  { code: 'ar' as Language, label: 'عربي', subtitle: 'عەرەبی' },
  { code: 'en' as Language, label: 'En...', subtitle: 'ئینگلیزی' },
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
        <TouchableOpacity 
          style={[styles.staffButton, { top: insets.top + 16 }]}
          onPress={handleStaffLogin}
          activeOpacity={0.7}
        >
          <User size={20} color={Colors.gold} />
          <Text style={styles.staffButtonText}>Staff/Admin</Text>
        </TouchableOpacity>

        <View style={[styles.content, isSmallScreen && styles.contentSmall]}>
          <Image
            source={require('@/assets/images/adaptive-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>تەپسی سلێمانی</Text>
          <Text style={styles.subtitle}>تامو چێژێکی رەسەنی کوردی لە تەپسی سلێمانی بچێژە</Text>
          
          <View style={styles.divider} />
          
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
                  lang.code === 'ku' && styles.languageLabelKurdish,
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

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.gold, Colors.goldDark]}
              style={styles.continueGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.continueText}>
                {selectedLang === 'ku' ? 'دەستپێبکە' : selectedLang === 'ar' ? 'ابدأ' : 'Get Started'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
    position: 'absolute',
    right: 24,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  staffButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gold,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.gold,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    ...Platform.select({
      web: {
        fontFamily: '"NRT Bold", "NRT", "peshang des 2", "Rudaw", "Rabar_021", "Kurdish Kufi", "Noto Sans Arabic", sans-serif',
      },
    }),
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E5E5',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
    paddingHorizontal: 20,
    ...Platform.select({
      web: {
        fontFamily: '"NRT Bold", "NRT", "peshang des 2", "Rudaw", "Rabar_021", "Kurdish Kufi", "Noto Sans Arabic", sans-serif',
      },
    }),
  },
  divider: {
    width: 80,
    height: 3,
    backgroundColor: Colors.gold,
    borderRadius: 2,
    marginBottom: 32,
    opacity: 0.6,
  },
  languagePrompt: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    ...Platform.select({
      web: {
        fontFamily: '"NRT Bold", "NRT", "peshang des 2", "Rudaw", "Rabar_021", "Kurdish Kufi", "Noto Sans Arabic", sans-serif',
      },
    }),
  },
  languageSubPrompt: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    ...Platform.select({
      web: {
        fontFamily: '"NRT Bold", "NRT", "peshang des 2", "Rudaw", "Rabar_021", "Kurdish Kufi", "Noto Sans Arabic", sans-serif',
      },
    }),
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
    paddingVertical: 20,
    paddingHorizontal: 24,
    minWidth: 110,
    maxWidth: 130,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  languageCardSmall: {
    minWidth: 95,
    maxWidth: 110,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  languageCardActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: Colors.gold,
    borderWidth: 2.5,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  languageLabel: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    ...Platform.select({
      web: {
        fontFamily: '"NRT Bold", "NRT", "peshang des 2", "Rudaw", "Rabar_021", "Kurdish Kufi", "Noto Sans Arabic", sans-serif',
      },
    }),
  },
  languageLabelKurdish: {
    color: Colors.gold,
  },
  languageLabelActive: {
    color: Colors.gold,
  },
  languageSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    ...Platform.select({
      web: {
        fontFamily: '"NRT Bold", "NRT", "peshang des 2", "Rudaw", "Rabar_021", "Kurdish Kufi", "Noto Sans Arabic", sans-serif',
      },
    }),
  },
  languageSubtitleActive: {
    color: 'rgba(212, 175, 55, 0.8)',
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 300,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  continueGradient: {
    paddingVertical: 18,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3D0101',
    letterSpacing: 0.5,
    ...Platform.select({
      web: {
        fontFamily: '"NRT Bold", "NRT", "peshang des 2", "Rudaw", "Rabar_021", "Kurdish Kufi", "Noto Sans Arabic", sans-serif',
      },
    }),
  },
});
