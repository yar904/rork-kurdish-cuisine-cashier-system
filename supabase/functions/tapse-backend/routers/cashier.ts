import { z } from "npm:zod";
import { publicProcedure, router } from "../trpc.ts";

export const cashierRouter = router({
  openOrders: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("orders")
      .select("id, table_id, status, payment_status, total, created_at")
      .not("status", "eq", "closed")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  }),
  dailySummary: publicProcedure
    .input(z.object({ date: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const day = input.date ?? new Date().toISOString().slice(0, 10);
      const { data, error } = await ctx.supabase
        .from("payments")
        .select("amount, status, created_at")
        .gte("created_at", `${day} 00:00`)
        .lte("created_at", `${day} 23:59`);
      if (error) throw error;
      const totals = data?.reduce(
        (acc, payment) => {
          acc[payment.status] = (acc[payment.status] ?? 0) + Number(payment.amount);
          return acc;
        },
        {} as Record<string, number>
      );
      return { date: day, totals };
    }),
  closeOrder: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from("orders")
        .update({ status: "closed", updated_at: new Date().toISOString() })
        .eq("id", input.orderId)
        .select("id,status,updated_at")
        .single();
      if (error) throw error;
      await ctx.supabase.from("order_events").insert({ order_id: input.orderId, event: "order_closed" });
      return data;
    })
});
