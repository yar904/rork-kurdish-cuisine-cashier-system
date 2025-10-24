// File: lib/api.ts

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

// Fetch all menu items
export const getMenuItems = async () => {
  const res = await fetch(`${API_URL}/menu`);
  if (!res.ok) throw new Error("Failed to fetch menu items");
  return await res.json();
};

// Create a new order
export const createOrder = async (order: {
  table_id: string;
  total: number;
  status: string;
}) => {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!res.ok) throw new Error("Failed to create order");
  return await res.json();
};

// Add an item to an order
export const addOrderItem = async (item: {
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
}) => {
  const res = await fetch(`${API_URL}/order-items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Failed to add order item");
  return await res.json();
};

// Get all orders
export const getAllOrders = async () => {
  const res = await fetch(`${API_URL}/orders`);
  if (!res.ok) throw new Error("Failed to fetch orders");
  return await res.json();
};