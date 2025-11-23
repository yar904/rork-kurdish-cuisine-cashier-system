import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "../../../../lib/supabase";

export const updateCategoryProcedure = publicProcedure
  .input(
    z.object({
      oldName: z.string(),
      newName: z.string().min(1, "Category name is required"),
    })
  )
  .mutation(async ({ input }) => {
    const { error } = await supabase
      .from("menu_items")
      .update({ category: input.newName })
      .eq("category", input.oldName);

    if (error) {
      console.error("Error updating category:", error);
      throw new Error(`Failed to update category: ${error.message}`);
    }

    return {
      success: true,
      message: "Category updated successfully",
    };
  });

export default updateCategoryProcedure;
