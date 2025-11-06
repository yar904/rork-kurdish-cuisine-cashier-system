import { publicProcedure } from "../../../create-context";
import { supabase } from "@/backend/lib/supabase";
import { z } from "zod";

export const updateInventoryProcedure = publicProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      category: z.string().optional(),
      unit: z.string().optional(),
      currentStock: z.number().optional(),
      minimumStock: z.number().optional(),
      costPerUnit: z.number().optional(),
      supplierId: z.string().optional().nullable(),
    })
  )
  .mutation(async ({ input }) => {
    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.unit !== undefined) updateData.unit = input.unit;
    if (input.currentStock !== undefined) updateData.current_stock = input.currentStock;
    if (input.minimumStock !== undefined) updateData.minimum_stock = input.minimumStock;
    if (input.costPerUnit !== undefined) updateData.cost_per_unit = input.costPerUnit;
    if (input.supplierId !== undefined) updateData.supplier_id = input.supplierId;

    const { data, error } = await supabase
      .from("inventory_items")
      .update(updateData)
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating inventory item:", error);
      throw new Error("Failed to update inventory item");
    }

    return data;
  });
