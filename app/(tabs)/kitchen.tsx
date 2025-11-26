import React, { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, Text, View } from 'react-native';
import { trpc } from '@/lib/trpcClient';

export default function KitchenScreen() {
  const [queue, setQueue] = useState<any[]>([]);

  const loadQueue = () =>
    trpc.kitchen.queue
      .query()
      .then(setQueue)
      .catch((err) => Alert.alert('Kitchen error', err.message));

  const updateStatus = async (itemId: number, status: 'new' | 'in_progress' | 'done') => {
    await trpc.kitchen.updateItem.mutate({ itemId, status });
    loadQueue();
  };

  useEffect(() => {
    loadQueue();
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Kitchen Display</Text>
      {queue.map((item) => (
        <View key={item.id} style={{ padding: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 12 }}>
          <Text>Order #{item.order_id}</Text>
          <Text>Table: {item.table_label ?? 'N/A'}</Text>
          <Text>
            {item.quantity} x {item.item_name}
          </Text>
          <Text>Status: {item.status}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Button title="Start" onPress={() => updateStatus(item.id, 'in_progress')} />
            <Button title="Done" onPress={() => updateStatus(item.id, 'done')} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
