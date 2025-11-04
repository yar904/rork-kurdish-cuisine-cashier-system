import { Stack } from "expo-router";
import { Platform, View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TableProvider } from "@/contexts/TableContext";
import { RestaurantProvider } from "@/contexts/RestaurantContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { useEffect, useState } from "react";
import { useFonts, NotoNaskhArabic_400Regular, NotoNaskhArabic_600SemiBold, NotoNaskhArabic_700Bold } from '@expo-google-fonts/noto-naskh-arabic';

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
      <Stack.Screen name="menu-management" options={{ headerShown: false }} />
      <Stack.Screen name="employees" options={{ headerShown: false }} />
      <Stack.Screen name="clock-in-out" options={{ headerShown: false }} />
      <Stack.Screen name="employee-shifts" options={{ headerShown: false }} />
      <Stack.Screen name="employee-metrics" options={{ headerShown: false }} />
      <Stack.Screen name="inventory" options={{ headerShown: false }} />
      <Stack.Screen name="table-qr-codes" options={{ headerShown: false }} />
      <Stack.Screen name="customer-order" options={{ headerShown: false }} />
      <Stack.Screen
        name="font-preview"
        options={{ headerShown: true, title: "Kurdish Fonts" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NotoNaskhArabic_400Regular,
    NotoNaskhArabic_600SemiBold,
    NotoNaskhArabic_700Bold,
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      try {
        const style = document.createElement("style");
        style.innerHTML = `
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
          * {
            font-family: 'Noto Naskh Arabic', 'Montserrat', 'Segoe UI', Roboto, sans-serif;
            font-weight: 600;
          }
        `;
        document.head.appendChild(style);
      } catch (err) {
        console.log('Font loading error (web):', err);
      }
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsReady(true);
    } else if (fontsLoaded) {
      setIsReady(true);
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('Force ready after timeout');
      setIsReady(true);
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} {...({} as any)}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <OfflineProvider>
            <NotificationProvider>
              <AuthProvider>
                <LanguageProvider>
                  <TableProvider>
                    <RestaurantProvider>
                      <RootLayoutNav />
                    </RestaurantProvider>
                  </TableProvider>
                </LanguageProvider>
              </AuthProvider>
            </NotificationProvider>
          </OfflineProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );
}