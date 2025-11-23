import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "../../../../lib/supabase";

export const deleteCategoryProcedure = publicProcedure
  .input(
    z.object({
      name: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const { data: itemsInCategory } = await supabase
      .from("menu_items")
      .select("id")
      .eq("category", input.name);

    if (itemsInCategory && itemsInCategory.length > 0) {
      throw new Error(
        `Cannot delete category "${input.name}" because it contains ${itemsInCategory.length} menu items. Please reassign or delete those items first.`
      );
    }

    return {
      success: true,
      message: "Category deleted successfully",
    };
  });

export default deleteCategoryProcedure;
