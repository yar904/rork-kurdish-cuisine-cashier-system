import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const createRatingProcedure = publicProcedure
  .input(
    z.object({
      menuItemId: z.string(),
      tableNumber: z.number(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { menuItemId, tableNumber, rating, comment } = input;

    const { data, error } = await supabase
      .from("menu_item_ratings")
      .insert({
        menu_item_id: menuItemId,
        table_number: tableNumber,
        rating,
        comment: comment || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating rating:", error);
      throw new Error("Failed to create rating");
    }

    return { success: true, rating: data };
  });
