import { publicProcedure } from "../../../create-context.js";
import { supabase } from "../../../../../lib/supabase.js";
import { z } from "zod";

export const adjustStockProcedure = publicProcedure
  .input(
    z.object({
      inventoryItemId: z.string(),
      quantity: z.number(),
      movementType: z.enum(["purchase", "waste", "adjustment", "order"]),
      notes: z.string().optional(),
      referenceId: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { data: item } = await supabase
      .from("inventory_items")
      .select("current_stock")
      .eq("id", input.inventoryItemId)
      .single();

    if (!item) {
      throw new Error("Inventory item not found");
    }

    const newStock = item.current_stock + input.quantity;

    if (newStock < 0) {
      throw new Error("Insufficient stock");
    }

    const { error: updateError } = await supabase
      .from("inventory_items")
      .update({ current_stock: newStock })
      .eq("id", input.inventoryItemId);

    if (updateError) {
      console.error("Error updating stock:", updateError);
      throw new Error("Failed to update stock");
    }

    const { data: movement, error: movementError } = await supabase
      .from("stock_movements")
      .insert({
        inventory_item_id: input.inventoryItemId,
        movement_type: input.movementType,
        quantity: input.quantity,
        reference_id: input.referenceId || null,
        notes: input.notes || null,
      })
      .select()
      .single();

    if (movementError) {
      console.error("Error creating stock movement:", movementError);
      throw new Error("Failed to create stock movement");
    }

    return movement;
  });
