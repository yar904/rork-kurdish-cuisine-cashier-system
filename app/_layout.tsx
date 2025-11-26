import { Stack } from 'expo-router';
import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { TableProvider } from '@/contexts/TableContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <TableProvider>
            <Stack screenOptions={{ headerShown: true }} />
          </TableProvider>
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
