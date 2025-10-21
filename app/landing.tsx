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
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 38,
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
  subtitle: {
    fontSize: 18,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 32,
    ...Platform.select({
      web: {
        fontFamily: '"NRT Bold", "NRT", "peshang des 2", "Rudaw", "Rabar_021", "Kurdish Kufi", "Noto Sans Arabic", sans-serif',
      },
    }),
  },
  languagePrompt: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    ...Platform.select({
      web: {
        fontFamily: '"NRT Bold", "NRT", "peshang des 2", "Rudaw", "Rabar_021", "Kurdish Kufi", "Noto Sans Arabic", sans-serif',
      },
    }),
  },
  languageSubPrompt: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 28,
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
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 20,
    paddingHorizontal: 24,
    minWidth: 110,
    maxWidth: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageCardSmall: {
    minWidth: 95,
    maxWidth: 110,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  languageCardActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderColor: Colors.gold,
    borderWidth: 3,
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
  },
  continueGradient: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#3D0101',
    ...Platform.select({
      web: {
        fontFamily: '"NRT Bold", "NRT", "peshang des 2", "Rudaw", "Rabar_021", "Kurdish Kufi", "Noto Sans Arabic", sans-serif',
      },
    }),
  },
});
