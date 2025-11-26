import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { trpc } from '@/lib/trpcClient';

export default function PublicMenuScreen() {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trpc.menu.categoriesWithItems
      .query()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 12 }}>Public Menu</Text>
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
      {data.map((category) => (
        <View key={category.id} style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>{category.name}</Text>
          {category.menu_items?.map((item: any) => (
            <View key={item.id} style={{ paddingVertical: 6 }}>
              <Text style={{ fontSize: 16 }}>{item.name}</Text>
              <Text style={{ color: '#555' }}>{item.description}</Text>
              <Text style={{ fontWeight: '600' }}>${Number(item.price).toFixed(2)}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
