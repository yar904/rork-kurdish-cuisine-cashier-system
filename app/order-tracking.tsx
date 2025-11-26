import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View, Button } from 'react-native';
import { trpc } from '@/lib/trpcClient';

export default function OrderTrackingScreen() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<any>(null);

  const loadOrder = async () => {
    if (!orderId) return;
    try {
      const data = await trpc.orders.byId.query({ orderId: Number(orderId) });
      setOrder(data);
    } catch (error: any) {
      Alert.alert('Lookup failed', error.message);
    }
  };

  useEffect(() => {
    if (orderId) loadOrder();
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 12 }}>Order Tracking</Text>
      <TextInput
        value={orderId}
        onChangeText={setOrderId}
        placeholder="Enter order ID"
        keyboardType="number-pad"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 12 }}
      />
      <Button title="Track" onPress={loadOrder} />
      {order && (
        <View style={{ marginTop: 16 }}>
          <Text>Status: {order.status}</Text>
          <Text>Payment: {order.payment_status}</Text>
          <Text>Total: ${Number(order.total).toFixed(2)}</Text>
          <Text style={{ fontWeight: '600', marginTop: 12 }}>Items</Text>
          {order.order_items?.map((item: any) => (
            <View key={item.id} style={{ paddingVertical: 6 }}>
              <Text>
                {item.quantity} x {item.menu_item_id} ({item.status})
              </Text>
              <Text>Notes: {item.notes ?? '—'}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
