import { Platform } from 'react-native';

export const fonts = {
  regular: Platform.select({
    ios: 'San Francisco',
    android: 'sans-serif',
    default: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  }),
  medium: Platform.select({
    ios: 'San Francisco',
    android: 'sans-serif-medium',
    default: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  }),
  semiBold: Platform.select({
    ios: 'San Francisco',
    android: 'sans-serif-medium',
    default: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  }),
  bold: Platform.select({
    ios: 'San Francisco',
    android: 'sans-serif',
    default: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  }),
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
  
  background: '#FFFDD0',
  backgroundGray: '#F5F3C8',
  cardBackground: '#FFFFFF',
  
  text: '#1A1A1A',
  textSecondary: '#666666',
  textLight: '#999999',
  
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  
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
