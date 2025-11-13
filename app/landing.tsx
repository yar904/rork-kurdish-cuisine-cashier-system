import React, { useState } from 'react';
import {
  View,
  Text as RNText,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
  Linking,
  Platform,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';
import { Globe, Instagram } from 'lucide-react-native';
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
  const [isReady, setIsReady] = useState(false);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  const handleLanguageSelect = async (lang: Language) => {
    setSelectedLang(lang);
    await setLanguage(lang);
    setShowLanguages(false);
  };

  const handleContinue = () => {
    router.replace('/public-menu');
  };



  React.useEffect(() => {
    if (!isLoading) {
      setSelectedLang(language);
      setIsReady(true);
    }
  }, [language, isLoading]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isReady) {
        setIsReady(true);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [isReady]);

  if (!isReady) {
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
      {Platform.OS !== 'web' ? (
        <Video
          source={{ uri: 'https://res.cloudinary.com/dfqd5ftwp/video/upload/v1734106789/kurdish-food-background_oqz1bh.mp4' }}
          style={styles.background}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
        />
      ) : (
        isLargeScreen ? (
          <LinearGradient
            colors={['#1a0000', '#3d0101', '#1a0000']}
            style={styles.background}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        ) : (
          <LinearGradient
            colors={['#1a0000', '#3d0101', '#1a0000']}
            style={styles.background}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )
      )}
      <View style={styles.absoluteOverlay}>
        <LinearGradient
          colors={isLargeScreen ? ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)'] : ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.8)']}
          style={styles.overlay}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
          <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity 
              style={styles.languageButton}
              onPress={() => setShowLanguages(!showLanguages)}
              activeOpacity={0.7}
            >
              <Globe size={20} color="#FFFFFF" strokeWidth={2} />
              <RNText style={styles.languageButtonText}>{currentLanguage?.label}</RNText>
            </TouchableOpacity>
            
            <View style={{ width: 120 }} />
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
                  <RNText style={[
                    styles.languageOptionText,
                    selectedLang === lang.code && styles.languageOptionTextActive,
                  ]}>
                    {lang.label}
                  </RNText>
                </TouchableOpacity>
              ))}
            </View>
          )}

            <View style={styles.spacer} />
            
            <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 20) + 32 }]}>              
              <TouchableOpacity
                style={styles.menuButton}
                onPress={handleContinue}
                activeOpacity={0.8}
              >
                <RNText style={styles.menuButtonText}>Menu</RNText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => Linking.openURL('https://www.instagram.com/tapse_slimane/')}
                activeOpacity={0.7}
              >
                <Instagram size={22} color="rgba(255, 255, 255, 0.9)" strokeWidth={1.5} />
              </TouchableOpacity>
              
              <View style={styles.separator} />
              
              <RNText style={styles.poweredBy}>Powered by</RNText>
              <TouchableOpacity 
                onPress={() => Linking.openURL('https://www.instagram.com/yar.khader12/')}
                activeOpacity={0.7}
              >
                <RNText style={styles.brandName}>Yar</RNText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  absoluteOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  spacer: {
    flex: 1,
    minHeight: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(61, 1, 1, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.gold + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  languageButtonText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  languageDropdown: {
    position: 'absolute',
    left: 20,
    backgroundColor: 'rgba(61, 1, 1, 0.97)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gold + '40',
    overflow: 'hidden',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    alignSelf: 'flex-start',
  },
  languageOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)',
  },
  languageOptionActive: {
    backgroundColor: Colors.gold + '20',
  },
  languageOptionText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  languageOptionTextActive: {
    fontFamily: fonts.semiBold,
    color: Colors.gold,
  },
  bottomSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  menuButton: {
    width: '100%',
    maxWidth: 400,
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold + '60',
    alignItems: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: Colors.gold,
    letterSpacing: 1,
  },
  socialButton: {
    marginTop: 4,
    padding: 8,
  },
  separator: {
    width: '100%',
    maxWidth: 400,
    height: 1,
    backgroundColor: 'rgba(139, 69, 19, 0.2)',
    marginTop: 4,
  },
  poweredBy: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  brandName: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: 'rgba(139, 69, 19, 0.7)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  titleContainer: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  restaurantName: {
    fontFamily: fonts.heading,
    fontSize: 44,
    color: Colors.gold,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },



  footerContainer: {
    marginTop: 32,
    paddingTop: 24,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.gold + '30',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  footerTagline: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: Colors.gold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
