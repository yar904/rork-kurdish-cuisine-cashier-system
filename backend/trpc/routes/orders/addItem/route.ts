import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/backend/lib/supabase";
import { z } from "zod";

export const addItemProcedure = publicProcedure
  .input(
    z.object({
      orderId: z.string(),
      menuItemId: z.string(),
      quantity: z.number().min(1),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { data: existingItem, error: checkError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", input.orderId)
      .eq("menu_item_id", input.menuItemId)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Failed to check existing item: ${checkError.message}`);
    }

    if (existingItem) {
      const { data, error } = await supabase
        .from("order_items")
        .update({ quantity: existingItem.quantity + input.quantity })
        .eq("id", existingItem.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update item quantity: ${error.message}`);
      }

      await updateOrderTotal(input.orderId);
      return data;
    } else {
      const { data, error } = await supabase
        .from("order_items")
        .insert({
          order_id: input.orderId,
          menu_item_id: input.menuItemId,
          quantity: input.quantity,
          notes: input.notes,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add item: ${error.message}`);
      }

      await updateOrderTotal(input.orderId);
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
