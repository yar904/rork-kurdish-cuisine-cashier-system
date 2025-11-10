import { publicProcedure } from "../../../create-context";
import { supabase } from "@/backend/lib/supabase";
import { z } from "zod";

export const getMenuIngredientsProcedure = publicProcedure
  .input(z.object({ menuItemId: z.string() }))
  .query(async ({ input }) => {
    const { data, error } = await supabase
      .from("menu_item_ingredients")
      .select("*, inventory_items(*)")
      .eq("menu_item_id", input.menuItemId);

    if (error) {
      console.error("Error fetching menu ingredients:", error);
      throw new Error("Failed to fetch menu ingredients");
    }

    return data;
  });
