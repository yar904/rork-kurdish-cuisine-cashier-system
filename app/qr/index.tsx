import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text } from '@/components/CustomText';
import { Stack } from 'expo-router';
import { QrCode } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function QRLandingPage() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          title: 'Scan QR Code',
          headerStyle: { backgroundColor: '#5C0000' },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
        }}
      />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <QrCode size={120} color="#5C0000" />
        </View>

        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.message}>
          Please scan the QR code on your table to view our menu and place your order.
        </Text>

        <View style={styles.instructionBox}>
          <Text style={styles.instructionTitle}>How to order:</Text>
          <Text style={styles.instruction}>1. Find the QR code on your table</Text>
          <Text style={styles.instruction}>2. Scan it with your camera</Text>
          <Text style={styles.instruction}>3. Browse the menu and add items</Text>
          <Text style={styles.instruction}>4. Place your order - we will bring it to your table!</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6EEDD',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    ...Platform.select({
      web: {
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  iconContainer: {
    marginBottom: 32,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      },
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  instructionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    gap: 12,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#5C0000',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 15,
    color: '#3A3A3A',
    lineHeight: 22,
  },
});
