import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/backend/lib/supabase";
import { z } from "zod";

export default publicProcedure
  .input(z.object({
    tableNumber: z.number(),
    items: z.array(z.object({
      menuItemId: z.string(),
      quantity: z.number(),
      notes: z.string().optional(),
    })),
    total: z.number(),
  }))
  .mutation(async ({ input }) => {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        table_number: input.tableNumber,
        status: "new",
        total: input.total,
      })
      .select()
      .single();

    if (orderError || !order) throw new Error("Failed to create order");

    for (const item of input.items) {
      await supabase.from("order_items").insert({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        notes: item.notes || "",
      });
    }

    return order;
  });