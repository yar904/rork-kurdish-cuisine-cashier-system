import { publicProcedure } from "../../../create-context";
<<<<<<< HEAD
import { supabase } from "@/lib/supabase";
=======
import { supabase } from "@/backend/lib/supabase";
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
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
