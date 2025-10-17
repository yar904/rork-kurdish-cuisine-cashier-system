import { Tabs } from "expo-router";
import { ShoppingCart, ChefHat, ClipboardList, BarChart3, Settings } from "lucide-react-native";
import React from "react";
import { Colors } from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TabLayout() {
  const { t } = useLanguage();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="cashier"
        options={{
          title: t('cashier'),
          tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="kitchen"
        options={{
          title: t('kitchen'),
          tabBarIcon: ({ color }) => <ChefHat size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="waiter"
        options={{
          title: t('waiter'),
          tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: t('analytics'),
          tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
