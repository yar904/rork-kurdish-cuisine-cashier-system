import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { trpc } from '@/lib/trpcClient';
import { useTable } from '@/contexts/TableContext';

export default function CustomerOrderScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const { table, setTableBySlug } = useTable();
  const [menu, setMenu] = useState<any[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    if (slug) setTableBySlug(slug);
    trpc.menu.categoriesWithItems.query().then(setMenu).catch((err) => Alert.alert('Menu error', err.message));
  }, [slug]);

  const addToCart = (itemId: number) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[itemId]) {
        updated[itemId] -= 1;
        if (updated[itemId] <= 0) delete updated[itemId];
      }
      return updated;
    });
  };

  const cartItems = useMemo(() => {
    const items: any[] = [];
    menu.forEach((cat) => {
      cat.menu_items?.forEach((item: any) => {
        if (cart[item.id]) items.push({ ...item, quantity: cart[item.id] });
      });
    });
    return items;
  }, [cart, menu]);

  const placeOrder = async () => {
    if (!table && !slug) {
      Alert.alert('Missing table', 'Scan the QR code to identify your table.');
      return;
    }
    const payload = {
      tableSlug: slug,
      customerName: customerName || 'Guest',
      items: cartItems.map((item) => ({ menuItemId: item.id, quantity: item.quantity }))
    };
    try {
      const result = await trpc.orders.create.mutate(payload);
      Alert.alert('Order placed', `Order #${result.orderId} submitted`);
      setCart({});
    } catch (error: any) {
      Alert.alert('Order error', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 12 }}>Table {table?.label ?? 'Unknown'}</Text>
      <TextInput
        value={customerName}
        onChangeText={setCustomerName}
        placeholder="Your name"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 12 }}
      />
      {menu.map((category) => (
        <View key={category.id} style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>{category.name}</Text>
          {category.menu_items?.map((item: any) => (
            <View key={item.id} style={{ paddingVertical: 6, borderBottomWidth: 1, borderColor: '#f2f2f2' }}>
              <Text style={{ fontSize: 16 }}>{item.name}</Text>
              <Text style={{ color: '#555' }}>{item.description}</Text>
              <Text>${Number(item.price).toFixed(2)}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                <Button title="-" onPress={() => removeFromCart(item.id)} />
                <Text style={{ alignSelf: 'center' }}>{cart[item.id] ?? 0}</Text>
                <Button title="+" onPress={() => addToCart(item.id)} />
              </View>
            </View>
          ))}
        </View>
      ))}
      <Button title="Send order" onPress={placeOrder} disabled={cartItems.length === 0} />
    </ScrollView>
  );
}
