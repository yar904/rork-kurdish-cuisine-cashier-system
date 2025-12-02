import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Eye, Utensils, ShoppingCart, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

export default function DebugScreen() {
  const router = useRouter();

  const debugRoutes = [
    {
      title: 'Menu',
      description: 'Customer-facing menu with live tRPC data',
      path: '/menu',
      icon: Eye,
      color: '#3B82F6',
    },
    {
      title: 'Customer Order (Table 1)',
      description: 'QR code order page with menu browsing and cart',
      path: '/customer-order?table=1',
      icon: Utensils,
      color: '#D4AF37',
    },
    {
      title: 'Cashier Dashboard',
      description: 'Staff interface for taking orders',
      path: '/(tabs)/cashier',
      icon: ShoppingCart,
      color: '#10B981',
    },
    {
      title: 'Platform Scan',
      description: 'Run automated diagnostics for Supabase, tRPC, and Edge functions',
      path: '/debug/platform-scan',
      icon: ShieldCheck,
      color: '#EF4444',
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Debug Navigation',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
        }}
      />

      <View style={styles.content}>
        <Text style={styles.title}>🔧 Development Navigation</Text>
        <Text style={styles.subtitle}>Quick access to all main views</Text>

        <View style={styles.routesList}>
          {debugRoutes.map((route) => {
            const Icon = route.icon;
            return (
              <TouchableOpacity
                key={route.path}
                style={[styles.routeCard, { borderLeftColor: route.color }]}
                onPress={() => router.push(route.path as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: route.color + '20' }]}>
                  <Icon size={32} color={route.color} strokeWidth={2} />
                </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeTitle}>{route.title}</Text>
                  <Text style={styles.routeDescription}>{route.description}</Text>
                  <Text style={styles.routePath}>{route.path}</Text>
                </View>
                <ArrowRight size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            ℹ️ This screen is only for development. It won’t appear in production.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
  },
  content: {
    flex: 1,
    padding: 24,
    maxWidth: 800,
    alignSelf: 'center' as const,
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
    fontWeight: '500' as const,
  },
  routesList: {
    gap: 16,
  },
  routeCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    borderLeftWidth: 6,
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  routeInfo: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  routeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  routePath: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.primary,
    backgroundColor: Colors.backgroundGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start' as const,
  },
  note: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#3B82F620',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F640',
  },
  noteText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600' as const,
    lineHeight: 20,
  },
});
