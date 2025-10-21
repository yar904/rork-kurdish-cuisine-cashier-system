import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Text } from "react-native";
import { RestaurantProvider } from "@/contexts/RestaurantContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TableProvider } from "@/contexts/TableContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { trpc, trpcClient } from "@/lib/trpc";

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
  const [fontsLoaded, fontError] = useFonts({
    'NRT-Regular': require('../assets/fonts/NRT-Regular.ttf'),
    'NRT-Bold': require('../assets/fonts/NRT-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (fontsLoaded) {
        (Text as any).defaultProps = (Text as any).defaultProps || {};
        (Text as any).defaultProps.style = { fontFamily: 'NRT-Regular' };
      }
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
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
