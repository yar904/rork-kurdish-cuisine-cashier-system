import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/backend/lib/supabase";
import { z } from "zod";

export const getCustomerStatusProcedure = publicProcedure
  .input(z.object({ tableNumber: z.number() }))
  .query(async ({ input }) => {
    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        id,
        status,
        total,
        created_at,
        order_items (
          id,
          quantity,
          price,
          menu_item:menu_items (
            id,
            name
          )
        )
      `)
      .eq("table_number", input.tableNumber)
      .in("status", ["pending", "preparing", "ready", "served"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to fetch order status: ${error.message}`);
    }

    if (!order) {
      return {
        status: "no_order" as const,
        orderId: null,
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        createdAt: null,
      };
    }

    const subtotal = order.total / 1.1;
    const tax = order.total - subtotal;

    return {
      status: order.status as "pending" | "preparing" | "ready" | "served",
      orderId: order.id,
      items: (order.order_items || []).map((item: any) => ({
        name: item.menu_item?.name || "Unknown Item",
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: order.total,
      createdAt: order.created_at,
    };
  });
