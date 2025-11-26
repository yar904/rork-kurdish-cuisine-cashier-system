import React, { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, Text, View } from 'react-native';
import { trpc } from '@/lib/trpcClient';

export default function CashierScreen() {
  const [orders, setOrders] = useState<any[]>([]);

  const loadOrders = () =>
    trpc.cashier.openOrders
      .query()
      .then(setOrders)
      .catch((err) => Alert.alert('Cashier error', err.message));

  const closeOrder = async (orderId: number) => {
    await trpc.cashier.closeOrder.mutate({ orderId });
    loadOrders();
  };

  const markPaid = async (orderId: number, total: number) => {
    await trpc.orders.markPayment.mutate({ orderId, status: 'paid', amount: total });
    loadOrders();
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Cashier Dashboard</Text>
      {orders.map((order) => (
        <View key={order.id} style={{ padding: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 12 }}>
          <Text>Order #{order.id}</Text>
          <Text>Status: {order.status}</Text>
          <Text>Payment: {order.payment_status}</Text>
          <Text>Total: ${Number(order.total).toFixed(2)}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Button title="Mark Paid" onPress={() => markPaid(order.id, order.total)} />
            <Button title="Close" onPress={() => closeOrder(order.id)} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
