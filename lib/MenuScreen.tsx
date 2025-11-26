import React from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { trpc } from "@/lib/trpcClient";
import type { RouterOutputs } from "@/types/trpc";

type MenuItem = RouterOutputs["menu"]["getAll"][number];

export default function MenuScreen() {
  const menuQuery = trpc.menu.getAll.useQuery();
  const createOrderMutation = trpc.orders.create.useMutation();

  const handleOrder = async (item: MenuItem) => {
    try {
      const newOrder = await createOrderMutation.mutateAsync({
        table_id: "demo-table-1",
        tableNumber: 1,
        items: [
          {
            menuItemId: item.id,
            quantity: 1,
            notes: "",
          },
        ],
        total: item.price,
      });
      alert(`✅ Order created for ${item.name}`);
      console.log(newOrder);
    } catch (err) {
      alert("Failed to create order");
      console.error(err);
    }
  };

  if (menuQuery.isLoading) return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center" }} />;
  if (menuQuery.error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>{menuQuery.error.message}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>🍽 Menu</Text>
      <FlatList
        data={menuQuery.data || []}
        keyExtractor={(item: MenuItem) => item.id}
        renderItem={({ item }: { item: MenuItem }) => (
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