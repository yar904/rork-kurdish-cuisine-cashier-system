import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Button, Alert } from 'react-native';
import { trpc } from '@/lib/trpcClient';

export default function MenuScreen() {
  const [data, setData] = useState<any[]>([]);

  const loadMenu = () =>
    trpc.menu.categoriesWithItems
      .query()
      .then(setData)
      .catch((err) => Alert.alert('Menu error', err.message));

  useEffect(() => {
    loadMenu();
  }, []);

  const toggleAvailability = async (itemId: number, current: boolean) => {
    await trpc.menu.toggleAvailability.mutate({ itemId, isAvailable: !current });
    loadMenu();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 12 }}>Staff Menu</Text>
      {data.map((category) => (
        <View key={category.id} style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>{category.name}</Text>
          {category.menu_items?.map((item: any) => (
            <View key={item.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontSize: 16 }}>{item.name}</Text>
              <Text style={{ color: '#555' }}>{item.description}</Text>
              <Text style={{ fontWeight: '600' }}>${Number(item.price).toFixed(2)}</Text>
              <Button title={item.is_available ? 'Mark unavailable' : 'Mark available'} onPress={() => toggleAvailability(item.id, item.is_available)} />
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
