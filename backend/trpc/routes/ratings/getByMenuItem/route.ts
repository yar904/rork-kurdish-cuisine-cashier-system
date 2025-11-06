import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/backend/lib/supabase";

export const getRatingsByMenuItemProcedure = publicProcedure
  .input(
    z.object({
      menuItemId: z.string(),
    })
  )
  .query(async ({ input }) => {
    const { menuItemId } = input;

    const { data, error } = await supabase
      .from("menu_item_ratings")
      .select("*")
      .eq("menu_item_id", menuItemId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching ratings:", error);
      throw new Error("Failed to fetch ratings");
    }

    const ratings = data || [];
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0;

    return {
      ratings,
      totalRatings,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  });
