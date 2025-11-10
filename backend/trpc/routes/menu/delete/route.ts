import { publicProcedure } from "../../../create-context.js";
import { z } from "zod";
import { supabase } from "../../../../../lib/supabase.js";

const deleteMenuItemSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const deleteMenuItemProcedure = publicProcedure
  .input(deleteMenuItemSchema)
  .mutation(async ({ input }) => {
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", input.id);

    if (error) {
      console.error("Error deleting menu item:", error);
      throw new Error("Failed to delete menu item");
    }

    return { success: true };
  });

export default deleteMenuItemProcedure;
