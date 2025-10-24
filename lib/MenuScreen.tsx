import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { getMenuItems, createOrder } from "../lib/api";

export default function MenuScreen() {
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const data = await getMenuItems();
      setMenu(data);
    } catch (err) {
      console.error("Menu fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async (item: any) => {
    try {
      const newOrder = await createOrder({
        table_id: "demo-table-1",
        total: item.price,
        status: "pending",
      });
      alert(`✅ Order created for ${item.name}`);
      console.log(newOrder);
    } catch (err) {
      alert("Failed to create order");
      console.error(err);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center" }} />;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>🍽 Menu</Text>
      <FlatList
        data={menu}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleOrder(item)}
            style={{
              padding: 16,
              backgroundColor: "#f4f4f4",
              marginBottom: 10,
              borderRadius: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600" }}>{item.name}</Text>
            <Text style={{ color: "gray" }}>{item.description}</Text>
            <Text style={{ marginTop: 4 }}>💰 {item.price} IQD</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}