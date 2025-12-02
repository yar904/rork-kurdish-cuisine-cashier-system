import { Stack } from "expo-router";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpcClient";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TableProvider } from "@/contexts/TableContext";
import { RestaurantProvider } from "@/contexts/RestaurantContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { useFonts, NotoNaskhArabic_400Regular, NotoNaskhArabic_600SemiBold, NotoNaskhArabic_700Bold } from '@expo-google-fonts/noto-naskh-arabic';
import { PlayfairDisplay_400Regular, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold, PlayfairDisplay_800ExtraBold, PlayfairDisplay_900Black } from '@expo-google-fonts/playfair-display';
import { CormorantGaramond_400Regular, CormorantGaramond_600SemiBold, CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
    },
  },
});

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
  useEffect(() => {
    LogBox.ignoreLogs([
      'PostHog',
      'PostHogFetchNetworkError',
      'Network error while fetching PostHog',
      'Error while flushing PostHog',
    ]);

    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.error = (...args) => {
      const message = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0]);
      if (message && message.includes('PostHog')) {
        return;
      }
      originalConsoleError(...args);
    };
    
    console.warn = (...args) => {
      const message = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0]);
      if (message && message.includes('PostHog')) {
        return;
      }
      originalConsoleWarn(...args);
    };

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  const [fontsLoaded] = useFonts({
    NotoNaskhArabic_400Regular,
    NotoNaskhArabic_600SemiBold,
    NotoNaskhArabic_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_800ExtraBold,
    PlayfairDisplay_900Black,
    CormorantGaramond_400Regular,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (Platform.OS === "web") {
      const style = document.createElement("style");
      style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} {...({} as any)}>
      <QueryClientProvider client={queryClient}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <RealtimeProvider>
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
          </RealtimeProvider>
        </trpc.Provider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}