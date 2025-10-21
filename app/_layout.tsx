import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RestaurantProvider } from "@/contexts/RestaurantContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TableProvider } from "@/contexts/TableContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { trpc, trpcClient } from "@/lib/trpc";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="landing" options={{ headerShown: false }} />
      <Stack.Screen name="menu" options={{ headerShown: false }} />
      <Stack.Screen name="staff-login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="order-tracking" options={{ headerShown: false }} />
      <Stack.Screen name="category/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      console.log('✅ Fonts loaded successfully');
      SplashScreen.hideAsync();
    } else {
      console.log('⏳ Waiting for fonts...');
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#3D0101' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LanguageProvider>
              <TableProvider>
                <RestaurantProvider>
                  <RootLayoutNav />
                </RestaurantProvider>
              </TableProvider>
            </LanguageProvider>
          </AuthProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );
}
