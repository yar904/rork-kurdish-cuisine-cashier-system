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
  useEffect(() => {
    if (Platform.OS === "web") {
      const style = document.createElement("style");
      style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap');
        * {
          font-family: 'Montserrat', 'Segoe UI', Roboto, sans-serif;
          font-weight: 600;
        }
      `;
      document.head.appendChild(style);

      if ('serviceWorker' in navigator && !sessionStorage.getItem('cacheCleared')) {
        sessionStorage.setItem('cacheCleared', 'true');
        
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });

        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
        });

        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    }
  }, []);

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