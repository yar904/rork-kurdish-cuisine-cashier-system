import { z } from "npm:zod";
import { publicProcedure, router } from "../trpc.ts";

const kitchenStatusSchema = z.enum(["new", "in_progress", "done"]);

export const kitchenRouter = router({
  queue: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("kitchen_queue")
      .select("id, order_id, table_label, status, notes, item_name, quantity, order_created_at, item_created_at")
      .order("order_created_at", { ascending: true });
    if (error) throw error;
    return data;
  }),
  updateItem: publicProcedure
    .input(z.object({ itemId: z.number(), status: kitchenStatusSchema, note: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from("order_items")
        .update({ status: input.status, notes: input.note ?? null, updated_at: new Date().toISOString() })
        .eq("id", input.itemId)
        .select("id, order_id, status, notes, updated_at")
        .single();
      if (error) throw error;
      await ctx.supabase.from("order_events").insert({ order_id: data.order_id ?? null, event: `kitchen:${input.status}` });
      return data;
    })
});
