import { Platform } from 'react-native';

export const fonts = {
  regular: Platform.select({
    ios: 'DMSans_400Regular',
    android: 'DMSans_400Regular',
    web: 'DM Sans, system-ui, sans-serif',
    default: 'DMSans_400Regular',
  }),
  medium: Platform.select({
    ios: 'DMSans_500Medium',
    android: 'DMSans_500Medium',
    web: 'DM Sans, system-ui, sans-serif',
    default: 'DMSans_500Medium',
  }),
  semiBold: Platform.select({
    ios: 'PlayfairDisplay_600SemiBold',
    android: 'PlayfairDisplay_600SemiBold',
    web: 'Playfair Display, serif',
    default: 'PlayfairDisplay_600SemiBold',
  }),
  bold: Platform.select({
    ios: 'PlayfairDisplay_700Bold',
    android: 'PlayfairDisplay_700Bold',
    web: 'Playfair Display, serif',
    default: 'PlayfairDisplay_700Bold',
  }),
  extraBold: Platform.select({
    ios: 'PlayfairDisplay_800ExtraBold',
    android: 'PlayfairDisplay_800ExtraBold',
    web: 'Playfair Display, serif',
    default: 'PlayfairDisplay_800ExtraBold',
  }),
  black: Platform.select({
    ios: 'PlayfairDisplay_900Black',
    android: 'PlayfairDisplay_900Black',
    web: 'Playfair Display, serif',
    default: 'PlayfairDisplay_900Black',
  }),
  heading: Platform.select({
    ios: 'CormorantGaramond_700Bold',
    android: 'CormorantGaramond_700Bold',
    web: 'Cormorant Garamond, serif',
    default: 'CormorantGaramond_700Bold',
  }),
  arabic: Platform.select({
    ios: 'NotoNaskhArabic_600SemiBold',
    android: 'NotoNaskhArabic_600SemiBold',
    web: 'Noto Naskh Arabic, serif',
    default: 'NotoNaskhArabic_600SemiBold',
  }),
  arabicBold: Platform.select({
    ios: 'NotoNaskhArabic_700Bold',
    android: 'NotoNaskhArabic_700Bold',
    web: 'Noto Naskh Arabic, serif',
    default: 'NotoNaskhArabic_700Bold',
  }),
};

export const getFontForLanguage = (language: 'en' | 'ku' | 'ar', weight: 'regular' | 'medium' | 'semiBold' | 'bold' | 'heading' = 'regular') => {
  if (language === 'ku' || language === 'ar') {
    if (weight === 'bold' || weight === 'semiBold' || weight === 'heading') {
      return fonts.arabicBold;
    }
    return fonts.arabic;
  }
  return fonts[weight];
};

export const fontSizes = {
  small: 14,
  normal: 16,
  large: 20,
  title: 24,
  header: 32,
};

export const Colors = {
  primary: '#3d0101',
  primaryDark: '#2d0000',
  primaryLight: '#5d0202',
  
  gold: '#D4AF37',
  goldDark: '#B8941F',
  goldLight: '#E8C968',
  
  cream: '#FFFDD0',
  creamDark: '#F5F3C8',
  
  background: '#1A0505',
  backgroundGray: '#0F0303',
  cardBackground: '#2D0808',
  
  text: '#FFFFFF',
  textSecondary: '#B8941F',
  textLight: '#8B7355',
  
  border: '#8B4513',
  borderLight: '#A0522D',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  statusNew: '#3B82F6',
  statusPreparing: '#F59E0B',
  statusReady: '#10B981',
  statusServed: '#8B5CF6',
  statusPaid: '#6B7280',
};
