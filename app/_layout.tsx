import { Stack } from "expo-router";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TableProvider } from "@/contexts/TableContext";
import { RestaurantProvider } from "@/contexts/RestaurantContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { useEffect } from "react";
<<<<<<< HEAD
=======
import { useFonts, NotoNaskhArabic_400Regular, NotoNaskhArabic_600SemiBold, NotoNaskhArabic_700Bold } from '@expo-google-fonts/noto-naskh-arabic';
import { PlayfairDisplay_400Regular, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold, PlayfairDisplay_800ExtraBold, PlayfairDisplay_900Black } from '@expo-google-fonts/playfair-display';
import { CormorantGaramond_400Regular, CormorantGaramond_600SemiBold, CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3

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
<<<<<<< HEAD
=======
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

>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
  useEffect(() => {
    if (Platform.OS === "web") {
      const style = document.createElement("style");
      style.innerHTML = `
<<<<<<< HEAD
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap');
        * {
          font-family: 'Montserrat', 'Segoe UI', Roboto, sans-serif;
          font-weight: 600;
        }
=======
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
      `;
      document.head.appendChild(style);
    }
  }, []);
<<<<<<< HEAD
=======

  if (!fontsLoaded) {
    return null;
  }
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3

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