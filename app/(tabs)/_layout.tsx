import { Tabs } from 'expo-router';
import React from 'react';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="cashier" options={{ title: 'Cashier' }} />
      <Tabs.Screen name="kitchen" options={{ title: 'Kitchen' }} />
      <Tabs.Screen name="waiter" options={{ title: 'Waiter' }} />
    </Tabs>
  );
}
