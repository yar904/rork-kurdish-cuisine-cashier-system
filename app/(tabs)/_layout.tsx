import { Tabs, useRouter } from "expo-router";
import { ShoppingCart, ChefHat, ClipboardList, BarChart3, Settings, FileText } from "lucide-react-native";
import React, { useEffect } from "react";
import { Colors } from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function TabLayout() {
  const { t } = useLanguage();
  const { user, isLoading, hasAccess } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user.authenticated) {
      router.replace('/staff-login');
    }
  }, [user.authenticated, isLoading, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user.authenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: 'rgba(212, 175, 55, 0.4)',
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <LinearGradient
            colors={['rgba(26, 0, 0, 0.98)', 'rgba(61, 1, 1, 0.98)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tabBarBackground}
          />
        ),
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
      }}
    >
      <Tabs.Screen
        name="cashier"
        options={{
          title: t('cashier'),
          tabBarIcon: ({ color }) => <ShoppingCart size={20} color={color} />,
          href: hasAccess('staff') ? '/(tabs)/cashier' : null,
        }}
      />
      <Tabs.Screen
        name="kitchen"
        options={{
          title: t('kitchen'),
          tabBarIcon: ({ color }) => <ChefHat size={20} color={color} />,
          href: hasAccess('staff') ? '/(tabs)/kitchen' : null,
        }}
      />
      <Tabs.Screen
        name="waiter"
        options={{
          title: 'Manager',
          tabBarIcon: ({ color }) => <ClipboardList size={20} color={color} />,
          href: hasAccess('staff') ? '/(tabs)/waiter' : null,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: t('analytics'),
          tabBarIcon: ({ color }) => <BarChart3 size={20} color={color} />,
          href: hasAccess('staff') ? '/(tabs)/analytics' : null,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => <FileText size={20} color={color} />,
          href: (user.role === 'admin' || user.role === 'manager') ? '/(tabs)/reports' : null,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: user.role === 'admin' ? 'Super Admin' : 'Manager',
          tabBarIcon: ({ color }) => <Settings size={20} color={color} />,
          href: (user.role === 'admin' || user.role === 'manager') ? '/(tabs)/admin' : null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.select({ ios: 80, default: 65 }) as number,
    backgroundColor: 'transparent',
    borderTopWidth: 2,
    borderTopColor: 'rgba(212, 175, 55, 0.4)',
    elevation: 0,
    paddingBottom: Platform.select({ ios: 20, default: 8 }) as number,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 -4px 20px rgba(212, 175, 55, 0.3)',
      },
    }),
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderTopWidth: 2,
    borderTopColor: 'rgba(212, 175, 55, 0.4)',
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
    marginTop: 2,
  },
  tabBarIcon: {
    marginBottom: 0,
  },
});
