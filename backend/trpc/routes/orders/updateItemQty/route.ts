import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/backend/lib/supabase";
import { z } from "zod";

export const updateItemQtyProcedure = publicProcedure
  .input(
    z.object({
      itemId: z.string(),
      quantity: z.number().min(0),
    })
  )
  .mutation(async ({ input }) => {
    if (input.quantity === 0) {
      const { error } = await supabase
        .from("order_items")
        .delete()
        .eq("id", input.itemId);

      if (error) {
        throw new Error(`Failed to remove item: ${error.message}`);
      }

      return { deleted: true };
    } else {
      const { data, error } = await supabase
        .from("order_items")
        .update({ quantity: input.quantity })
        .eq("id", input.itemId)
        .select(`
          *,
          order:orders (id)
        `)
        .single();

      if (error) {
        throw new Error(`Failed to update item quantity: ${error.message}`);
      }

      await updateOrderTotal(data.order.id);
      return data;
    }
  });

async function updateOrderTotal(orderId: string) {
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select(`
      quantity,
      menu_item:menu_items (price)
    `)
    .eq("order_id", orderId);

  if (itemsError) {
    console.error("Failed to fetch order items:", itemsError);
    return;
  }

  if (items.length === 0) {
    await supabase.from("orders").delete().eq("id", orderId);
    return;
  }

  const total = items.reduce((sum: number, item: any) => {
    return sum + item.quantity * item.menu_item.price;
  }, 0);

  const { error: updateError } = await supabase
    .from("orders")
    .update({ total })
    .eq("id", orderId);

  if (updateError) {
    console.error("Failed to update order total:", updateError);
  }
}
