import { publicProcedure } from "../../../create-context";
<<<<<<< HEAD
import { supabase } from "@/lib/supabase";
=======
import { supabase } from "@/backend/lib/supabase";
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
import { z } from "zod";

export const createInventoryProcedure = publicProcedure
  .input(
    z.object({
      name: z.string(),
      category: z.string(),
      unit: z.string(),
      currentStock: z.number(),
      minimumStock: z.number(),
      costPerUnit: z.number(),
      supplierId: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        name: input.name,
        category: input.category,
        unit: input.unit,
        current_stock: input.currentStock,
        minimum_stock: input.minimumStock,
        cost_per_unit: input.costPerUnit,
        supplier_id: input.supplierId || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating inventory item:", error);
      throw new Error("Failed to create inventory item");
    }

    await supabase.from("stock_movements").insert({
      inventory_item_id: data.id,
      movement_type: "initial",
      quantity: input.currentStock,
      notes: "Initial stock",
    });

    return data;
  });
