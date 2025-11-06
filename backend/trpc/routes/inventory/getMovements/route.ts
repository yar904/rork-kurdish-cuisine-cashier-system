import { publicProcedure } from "../../../create-context";
import { supabase } from "@/backend/lib/supabase";
import { z } from "zod";

export const getStockMovementsProcedure = publicProcedure
  .input(
    z.object({
      inventoryItemId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    let query = supabase
      .from("stock_movements")
      .select("*, inventory_items(name, unit)")
      .order("created_at", { ascending: false });

    if (input.inventoryItemId) {
      query = query.eq("inventory_item_id", input.inventoryItemId);
    }

    if (input.startDate) {
      query = query.gte("created_at", input.startDate);
    }

    if (input.endDate) {
      query = query.lte("created_at", input.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching stock movements:", error);
      throw new Error("Failed to fetch stock movements");
    }

    return data;
  });
