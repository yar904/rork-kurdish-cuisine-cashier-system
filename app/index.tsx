import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Utensils, Globe, ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

export default function DebugEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const navigateToCustomerOrder = () => {
    console.log('[DebugEntry] Navigating to customer-order with table=1');
    console.log('🔥 LOADING REAL CUSTOMER ORDER PAGE 🔥');
    router.push('/customer-order?table=1');
  };

  const navigateToPublicMenu = () => {
    router.push('/public-menu');
  };

  const navigateToStaffLogin = () => {
    router.push('/staff-login');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={[Colors.primary, '#2D0000', '#1A0000']}
        style={styles.gradient}
      >
        <View style={[styles.content, { paddingTop: Math.max(insets.top, 60), paddingBottom: Math.max(insets.bottom, 40) }]}>
          <View style={styles.header}>
            <Image 
              source={require('@/assets/images/icon.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Kurdish Cuisine Cashier</Text>
            <Text style={styles.subtitle}>Development Preview Mode</Text>
            <Text style={styles.instructionText}>👇 Tap below to see your ordering page</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={navigateToCustomerOrder}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconCircle}>
                  <Utensils size={28} color={Colors.primary} strokeWidth={2.5} />
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitle}>Customer Ordering</Text>
                  <Text style={styles.buttonSubtitle}>Table 1 • QR Scan Experience</Text>
                </View>
                <ChevronRight size={24} color={Colors.gold} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={navigateToPublicMenu}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconCircleSecondary}>
                  <Globe size={28} color={Colors.gold} strokeWidth={2.5} />
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitleSecondary}>Public Menu</Text>
                  <Text style={styles.buttonSubtitleSecondary}>View-Only Experience</Text>
                </View>
                <ChevronRight size={24} color={Colors.cream} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.tertiaryButton}
              onPress={navigateToStaffLogin}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconCircleTertiary}>
                  <Text style={styles.staffEmoji}>👨‍💼</Text>
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonTitleTertiary}>Staff Login</Text>
                  <Text style={styles.buttonSubtitleTertiary}>Access Admin Dashboard</Text>
                </View>
                <ChevronRight size={24} color={Colors.textSecondary} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>🛠️ Development Mode Only</Text>
            <Text style={styles.footerSubtext}>This screen will not appear in production</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.gold,
    marginBottom: 8,
    textAlign: 'center' as const,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.cream,
    textAlign: 'center' as const,
    opacity: 0.8,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: Colors.gold,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.goldDark,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  tertiaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.goldDark,
  },
  iconCircleSecondary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(61, 1, 1, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  iconCircleTertiary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  staffEmoji: {
    fontSize: 28,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.primary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  buttonSubtitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
    opacity: 0.7,
  },
  buttonTitleSecondary: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.gold,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  buttonSubtitleSecondary: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.cream,
    opacity: 0.7,
  },
  buttonTitleTertiary: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.cream,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  buttonSubtitleTertiary: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    opacity: 0.7,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.gold,
    marginBottom: 4,
    textAlign: 'center' as const,
  },
  footerSubtext: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    opacity: 0.7,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.gold,
    textAlign: 'center' as const,
    marginTop: 16,
    opacity: 0.9,
  },
});
