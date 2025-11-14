import { publicProcedure } from "../../../create-context";
import { supabase } from "../../../lib/supabase";
import { z } from "zod";

export const linkIngredientsProcedure = publicProcedure
  .input(
    z.object({
      menuItemId: z.string(),
      ingredients: z.array(
        z.object({
          inventoryItemId: z.string(),
          quantityNeeded: z.number(),
        })
      ),
    })
  )
  .mutation(async ({ input }) => {
    await supabase
      .from("menu_item_ingredients")
      .delete()
      .eq("menu_item_id", input.menuItemId);

    if (input.ingredients.length > 0) {
      const { error } = await supabase.from("menu_item_ingredients").insert(
        input.ingredients.map((ing) => ({
          menu_item_id: input.menuItemId,
          inventory_item_id: ing.inventoryItemId,
          quantity_needed: ing.quantityNeeded,
        }))
      );

      if (error) {
        console.error("Error linking ingredients:", error);
        throw new Error("Failed to link ingredients");
      }
    }

    return { success: true };
  });
