import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const getAllRatingsStatsProcedure = publicProcedure
  .query(async () => {
    const { data, error } = await supabase
      .from("menu_item_ratings")
      .select("menu_item_id, rating");

    if (error) {
      console.error("Error fetching all ratings:", error);
      throw new Error("Failed to fetch ratings");
    }

    const ratings = data || [];
    const statsMap = new Map<string, { total: number; sum: number; count: number }>();

    ratings.forEach((r) => {
      const existing = statsMap.get(r.menu_item_id) || { total: 0, sum: 0, count: 0 };
      existing.sum += r.rating;
      existing.count += 1;
      existing.total = existing.sum / existing.count;
      statsMap.set(r.menu_item_id, existing);
    });

    const stats: Record<string, { averageRating: number; totalRatings: number }> = {};
    statsMap.forEach((value, key) => {
      stats[key] = {
        averageRating: Math.round(value.total * 10) / 10,
        totalRatings: value.count,
      };
    });

    return stats;
  });
