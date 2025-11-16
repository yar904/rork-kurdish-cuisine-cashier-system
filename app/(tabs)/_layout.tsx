import { Tabs, useRouter } from "expo-router";
import { ShoppingCart, ChefHat, ClipboardList, BarChart3, Settings, FileText } from "lucide-react-native";
import React, { useEffect } from "react";
import { Colors } from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";


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
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        headerShown: false,
        tabBarStyle: styles.tabBar,
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
    height: Platform.select({ ios: 90, default: 70 }) as number,
    backgroundColor: '#007AFF',
    borderTopWidth: 0,
    paddingBottom: Platform.select({ ios: 26, default: 12 }) as number,
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  tabBarItem: {
    paddingVertical: 5,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
    marginTop: 4,
  },
  tabBarIcon: {
    marginBottom: 2,
  },
});
