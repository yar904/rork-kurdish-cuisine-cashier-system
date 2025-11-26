import React, { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, Text, View } from 'react-native';
import { trpc } from '@/lib/trpcClient';

export default function WaiterScreen() {
  const [tables, setTables] = useState<any[]>([]);

  const loadTables = () =>
    trpc.tables.list
      .query()
      .then(setTables)
      .catch((err) => Alert.alert('Table error', err.message));

  const markStatus = async (tableId: number, status: 'available' | 'occupied' | 'dirty') => {
    await trpc.tables.updateStatus.mutate({ tableId, status });
    loadTables();
  };

  useEffect(() => {
    loadTables();
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Waiter Tools</Text>
      {tables.map((table) => (
        <View key={table.id} style={{ padding: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 12 }}>
          <Text>
            {table.label} • Seats {table.seats}
          </Text>
          <Text>Status: {table.status}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Button title="Available" onPress={() => markStatus(table.id, 'available')} />
            <Button title="Occupied" onPress={() => markStatus(table.id, 'occupied')} />
            <Button title="Dirty" onPress={() => markStatus(table.id, 'dirty')} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
