import { z } from "npm:zod";
import { publicProcedure, router } from "../trpc.ts";

const orderStatusSchema = z.enum(["pending", "confirmed", "preparing", "ready", "served", "closed"]);
const paymentStatusSchema = z.enum(["unpaid", "paid", "refunded"]);

export const ordersRouter = router({
  create: publicProcedure
    .input(
      z.object({
        tableSlug: z.string().optional(),
        tableId: z.number().optional(),
        customerName: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(
          z.object({ menuItemId: z.number(), quantity: z.number().int().positive(), notes: z.string().optional() })
        )
      })
    )
    .mutation(async ({ input, ctx }) => {
      const tableId = input.tableId
        ? input.tableId
        : input.tableSlug
        ? (await ctx.supabase.from("tables").select("id").eq("qr_slug", input.tableSlug).single()).data?.id
        : null;

      const itemIds = input.items.map((i) => i.menuItemId);
      const { data: menuItems, error: menuError } = await ctx.supabase
        .from("menu_items")
        .select("id,price")
        .in("id", itemIds);
      if (menuError) throw menuError;

      const orderTotal = input.items.reduce((sum, item) => {
        const price = menuItems?.find((m) => m.id === item.menuItemId)?.price ?? 0;
        return sum + price * item.quantity;
      }, 0);

      const { data: order, error: orderError } = await ctx.supabase
        .from("orders")
        .insert({
          table_id: tableId ?? null,
          customer_name: input.customerName ?? null,
          status: "pending",
          payment_status: "unpaid",
          total: orderTotal,
          notes: input.notes ?? null
        })
        .select("id, status, payment_status, total, table_id")
        .single();
      if (orderError) throw orderError;

      const orderItemsPayload = input.items.map((item) => {
        const price = menuItems?.find((m) => m.id === item.menuItemId)?.price ?? 0;
        return {
          order_id: order.id,
          menu_item_id: item.menuItemId,
          quantity: item.quantity,
          unit_price: price,
          notes: item.notes ?? null
        };
      });

      const { error: itemsError } = await ctx.supabase.from("order_items").insert(orderItemsPayload);
      if (itemsError) throw itemsError;

      await ctx.supabase.from("order_events").insert({ order_id: order.id, event: "order_created" });

      return { orderId: order.id, total: orderTotal };
    }),
  byId: publicProcedure.input(z.object({ orderId: z.number() })).query(async ({ input, ctx }) => {
    const { data, error } = await ctx.supabase
      .from("orders")
      .select(
        `id, status, payment_status, total, notes, table_id, created_at, updated_at,
         order_items(id, menu_item_id, quantity, unit_price, status, notes, created_at),
         payments(id, amount, status, method, created_at)`
      )
      .eq("id", input.orderId)
      .single();
    if (error) throw error;
    return data;
  }),
  updateStatus: publicProcedure
    .input(z.object({ orderId: z.number(), status: orderStatusSchema }))
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from("orders")
        .update({ status: input.status, updated_at: new Date().toISOString() })
        .eq("id", input.orderId)
        .select("id,status,updated_at")
        .single();
      if (error) throw error;
      await ctx.supabase.from("order_events").insert({ order_id: input.orderId, event: `status:${input.status}` });
      return data;
    }),
  markPayment: publicProcedure
    .input(z.object({ orderId: z.number(), status: paymentStatusSchema, amount: z.number().nonnegative() }))
    .mutation(async ({ input, ctx }) => {
      const { error: paymentError } = await ctx.supabase
        .from("payments")
        .insert({ order_id: input.orderId, status: input.status, amount: input.amount, method: "cash" });
      if (paymentError) throw paymentError;

      const { data, error } = await ctx.supabase
        .from("orders")
        .update({ payment_status: input.status, updated_at: new Date().toISOString() })
        .eq("id", input.orderId)
        .select("id,payment_status,updated_at")
        .single();
      if (error) throw error;
      await ctx.supabase.from("order_events").insert({ order_id: input.orderId, event: `payment:${input.status}` });
      return data;
    })
});
