import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/backend/lib/supabase";
import { z } from "zod";

const ACTIVE_STATUSES = ["new", "preparing", "ready", "served", "paid"] as const;

export const getCustomerStatusProcedure = publicProcedure
  .input(z.object({ tableNumber: z.number() }))
  .query(async ({ input }) => {
    const { data: table, error: tableError } = await supabase
      .from("tables")
      .select("current_order_id, number")
      .eq("number", input.tableNumber)
      .single();

    if (tableError && tableError.code !== "PGRST116") {
      throw new Error(`Failed to fetch table: ${tableError.message}`);
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        total,
        created_at,
        updated_at,
        order_items (
          id,
          quantity,
          price,
          menu_item:menu_items (
            id,
            name,
            price
          )
        )
      `
      )
      .eq("table_number", input.tableNumber)
      .in("status", ACTIVE_STATUSES)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (orderError && orderError.code !== "PGRST116") {
      throw new Error(`Failed to fetch order status: ${orderError.message}`);
    }

    if (!order || (table && table.current_order_id && order.id !== table.current_order_id)) {
      return { hasOrder: false };
    }

    const items = (order.order_items || []).map(item => {
      const itemPrice = item.price ?? item.menu_item?.price ?? 0;
      return {
        name: item.menu_item?.name || "Unknown Item",
        quantity: item.quantity,
        price: itemPrice,
      };
    });

    const subtotal = Number(
      items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
    );
    const tax = Number((subtotal * 0.1).toFixed(2));
    const total = Number((order.total ?? subtotal + tax).toFixed(2));

    return {
      hasOrder: true,
      status: order.status as (typeof ACTIVE_STATUSES)[number],
      items,
      subtotal,
      tax,
      total,
      created_at: order.created_at,
      updated_at: order.updated_at,
    };
  });
