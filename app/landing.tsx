import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors } from '@/constants/colors';
import { Language } from '@/constants/i18n';
import Svg, { Path, Circle, G, Defs, Pattern, Rect } from 'react-native-svg';




const LANGUAGES = [
  { code: 'en' as Language, label: 'English', nativeLabel: 'English' },
  { code: 'ar' as Language, label: 'عربي', nativeLabel: 'Arabic' },
  { code: 'ku' as Language, label: 'کوردی', nativeLabel: 'Kurdish' },
];

export default function LandingPage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  const [dimensions, setDimensions] = React.useState(() => Dimensions.get('window'));

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const isTablet = width >= 768 && width < 1200;
  const isDesktop = width >= 1200;
  const isLandscape = width > height;
  const isSmallScreen = height < 700;

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLang(lang);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleContinue = async () => {
    await setLanguage(selectedLang);
    router.replace('/menu');
  };

  const handleStaffAccess = () => {
    router.push('/staff-login');
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 0 : insets.top, paddingBottom: Platform.OS === 'web' ? 0 : insets.bottom }]}>
      <View style={styles.videoContainer}>
        <Video
          source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/w8l0zstikdx9psmvy7hjw' }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
        />
        <View style={styles.videoOverlay} />
      </View>

      <View style={styles.patternOverlay} pointerEvents="none">
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <Pattern
              id="kurdishPattern"
              x="0"
              y="0"
              width="120"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              <Path
                d="M60 10 L70 30 L90 30 L75 45 L80 65 L60 50 L40 65 L45 45 L30 30 L50 30 Z"
                fill="none"
                stroke={Colors.gold}
                strokeWidth="0.5"
                opacity="0.08"
              />
              <Circle cx="20" cy="20" r="2" fill={Colors.gold} opacity="0.06" />
              <Circle cx="100" cy="100" r="2" fill={Colors.gold} opacity="0.06" />
              <Path
                d="M10 60 Q20 50, 30 60 T50 60"
                fill="none"
                stroke={Colors.goldLight}
                strokeWidth="0.5"
                opacity="0.05"
              />
            </Pattern>
          </Defs>
          
          <Rect width={width} height={height} fill="url(#kurdishPattern)" />
          
          <G opacity="0.04">
            <Path
              d="M0 ${height * 0.3} Q${width * 0.25} ${height * 0.25}, ${width * 0.5} ${height * 0.3} T${width} ${height * 0.3}"
              fill="none"
              stroke={Colors.gold}
              strokeWidth="2"
            />
            <Path
              d="M0 ${height * 0.7} Q${width * 0.25} ${height * 0.75}, ${width * 0.5} ${height * 0.7} T${width} ${height * 0.7}"
              fill="none"
              stroke={Colors.gold}
              strokeWidth="2"
            />
          </G>
          
          <G opacity="0.06">
            <Circle cx={width * 0.15} cy={height * 0.2} r="3" fill={Colors.goldLight} />
            <Circle cx={width * 0.85} cy={height * 0.25} r="3" fill={Colors.goldLight} />
            <Circle cx={width * 0.1} cy={height * 0.8} r="2.5" fill={Colors.goldLight} />
            <Circle cx={width * 0.9} cy={height * 0.75} r="2.5" fill={Colors.goldLight} />
            <Path
              d="M${width * 0.05} ${height * 0.5} L${width * 0.08} ${height * 0.48} L${width * 0.11} ${height * 0.5} L${width * 0.08} ${height * 0.52} Z"
              fill={Colors.gold}
            />
            <Path
              d="M${width * 0.92} ${height * 0.4} L${width * 0.95} ${height * 0.38} L${width * 0.98} ${height * 0.4} L${width * 0.95} ${height * 0.42} Z"
              fill={Colors.gold}
            />
          </G>
        </Svg>
      </View>

      <LinearGradient
        colors={['rgba(61, 1, 1, 0)', 'rgba(61, 1, 1, 0.85)', 'rgba(61, 1, 1, 0.98)']}
        style={[styles.overlay, isLandscape && styles.overlayLandscape]}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            (isTablet || isDesktop) && styles.contentTablet,
            isDesktop && styles.contentDesktop,
            isLandscape && styles.contentLandscape,
            isSmallScreen && styles.contentSmall,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[
            styles.titleContainer,
            (isTablet || isDesktop) && styles.titleContainerTablet,
            isSmallScreen && styles.titleContainerSmall,
          ]}>
            <View style={styles.logoBackground}>
              <Image
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zz04l0d1dzw9z6075ukb4' }}
                style={[
                  styles.logo,
                  isTablet && styles.logoTablet,
                  isDesktop && styles.logoDesktop,
                  isSmallScreen && styles.logoSmall,
                ]}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.tagline, isTablet && styles.taglineTablet, isDesktop && styles.taglineDesktop]}>Authentic Kurdish Cuisine</Text>
            <Text style={[styles.subtitle, isTablet && styles.subtitleTablet, isDesktop && styles.subtitleDesktop]}>Experience the rich flavors and traditions of Kurdish hospitality</Text>
          </View>



          <View style={[styles.languageContainer, (isTablet || isDesktop) && styles.languageContainerTablet]}>
            <View style={styles.languageIcon}>
              <Svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="{Colors.gold}"/>
              </Svg>
            </View>
            <Text style={[styles.languageTitle, isTablet && styles.languageTitleTablet, isDesktop && styles.languageTitleDesktop]}>Select Your Language</Text>
            <Text style={[styles.languageSubtitle, isTablet && styles.languageSubtitleTablet, isDesktop && styles.languageSubtitleDesktop]}>اختر لغتك • زمانەکەت هەڵبژێرە</Text>

            <View style={[styles.languageGrid, isLandscape && styles.languageGridLandscape]}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageButton,
                    selectedLang === lang.code && styles.languageButtonActive,
                    (isTablet || isDesktop) && styles.languageButtonTablet,
                  ]}
                  onPress={() => handleLanguageSelect(lang.code)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.languageLabel,
                      selectedLang === lang.code && styles.languageLabelActive,
                      isTablet && styles.languageLabelTablet,
                      isDesktop && styles.languageLabelDesktop,
                    ]}
                  >
                    {lang.label}
                  </Text>
                  <Text
                    style={[
                      styles.languageNative,
                      selectedLang === lang.code && styles.languageNativeActive,
                      isTablet && styles.languageNativeTablet,
                      isDesktop && styles.languageNativeDesktop,
                    ]}
                  >
                    {lang.nativeLabel}
                  </Text>
                  {selectedLang === lang.code && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[styles.continueButton, (isTablet || isDesktop) && styles.continueButtonTablet]}
              onPress={handleContinue}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[Colors.gold, Colors.goldDark]}
                style={styles.continueButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.continueButtonText, isTablet && styles.continueButtonTextTablet, isDesktop && styles.continueButtonTextDesktop]}>Continue to Menu</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={[styles.staffButton, (isTablet || isDesktop) && styles.staffButtonTablet]}
            onPress={handleStaffAccess}
            activeOpacity={0.8}
          >
            <Users size={20} color={Colors.gold} />
            <Text style={[styles.staffButtonText, isTablet && styles.staffButtonTextTablet]}>Staff Access</Text>
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <View style={styles.footerLogoContainer}>
              <Image
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zz04l0d1dzw9z6075ukb4' }}
                style={styles.footerLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.footer, isTablet && styles.footerTablet, isDesktop && styles.footerDesktop]}>Welcome to authentic Kurdish dining</Text>
            <Text style={[styles.footerCopyright, isTablet && styles.footerCopyrightTablet]}>© 2025 Tapse Restaurant. All rights reserved.</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primaryDark,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  overlayLandscape: {
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    paddingTop: 40,
    ...Platform.select({
      web: {
        paddingHorizontal: 32,
      },
    }),
  },
  contentTablet: {
    paddingHorizontal: 80,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  contentDesktop: {
    maxWidth: 1100,
    paddingHorizontal: 100,
  },
  contentLandscape: {
    paddingVertical: 20,
  },
  contentSmall: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 48,
    flexShrink: 0,
  },
  titleContainerTablet: {
    marginBottom: 56,
  },
  titleContainerSmall: {
    marginBottom: 32,
  },
  logoBackground: {
    alignSelf: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    maxWidth: '100%',
    aspectRatio: 1,
  },
  logoTablet: {
    width: 140,
    height: 140,
    shadowRadius: 16,
    elevation: 12,
  },
  logoDesktop: {
    width: 140,
    height: 140,
    shadowRadius: 20,
    elevation: 14,
  },
  logoSmall: {
    width: 140,
    height: 140,
  },
  tagline: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gold,
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 1,
  },
  taglineTablet: {
    fontSize: 32,
    marginTop: 20,
  },
  taglineDesktop: {
    fontSize: 36,
    marginTop: 24,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.cream,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  subtitleTablet: {
    fontSize: 17,
    marginTop: 12,
    lineHeight: 24,
  },
  subtitleDesktop: {
    fontSize: 19,
    marginTop: 16,
    lineHeight: 28,
  },

  languageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 28,
    padding: 28,
    marginBottom: 24,
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    flexShrink: 0,
    ...Platform.select({
      ios: {
        shadowColor: Colors.gold,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  languageContainerTablet: {
    padding: 36,
    borderRadius: 32,
    marginBottom: 32,
  },
  languageIcon: {
    alignSelf: 'center' as const,
    marginBottom: 12,
  },
  languageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.cream,
    textAlign: 'center',
    marginBottom: 4,
  },
  languageTitleTablet: {
    fontSize: 26,
    marginBottom: 6,
  },
  languageTitleDesktop: {
    fontSize: 30,
    marginBottom: 8,
  },
  languageSubtitle: {
    fontSize: 14,
    color: Colors.cream,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 20,
  },
  languageSubtitleTablet: {
    fontSize: 17,
    marginBottom: 28,
  },
  languageSubtitleDesktop: {
    fontSize: 19,
    marginBottom: 32,
  },
  languageGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  languageGridLandscape: {
    gap: 16,
  },
  languageButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 100,
    justifyContent: 'center',
    minWidth: 0,
  },
  languageButtonTablet: {
    minHeight: 130,
    padding: 28,
    borderRadius: 20,
  },
  languageButtonActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  languageLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.cream,
    marginBottom: 4,
  },
  languageLabelTablet: {
    fontSize: 32,
    marginBottom: 6,
  },
  languageLabelDesktop: {
    fontSize: 36,
    marginBottom: 8,
  },
  languageLabelActive: {
    color: Colors.gold,
  },
  languageNative: {
    fontSize: 12,
    color: Colors.cream,
    opacity: 0.6,
  },
  languageNativeTablet: {
    fontSize: 15,
  },
  languageNativeDesktop: {
    fontSize: 17,
  },
  languageNativeActive: {
    opacity: 0.9,
    color: Colors.goldLight,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  continueButtonTablet: {
    borderRadius: 20,
  },
  continueButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },
  continueButtonTextTablet: {
    fontSize: 22,
    letterSpacing: 1.5,
  },
  continueButtonTextDesktop: {
    fontSize: 24,
    letterSpacing: 2,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.15)',
  },
  footerLogoContainer: {
    marginBottom: 16,
  },
  footerLogo: {
    width: 60,
    height: 60,
    opacity: 0.7,
  },
  footer: {
    fontSize: 13,
    color: Colors.cream,
    opacity: 0.6,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  footerTablet: {
    fontSize: 15,
  },
  footerDesktop: {
    fontSize: 17,
  },
  footerCopyright: {
    fontSize: 11,
    color: Colors.cream,
    opacity: 0.4,
    textAlign: 'center',
  },
  footerCopyrightTablet: {
    fontSize: 13,
  },
  staffButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  staffButtonTablet: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  staffButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  staffButtonTextTablet: {
    fontSize: 18,
  },
});
