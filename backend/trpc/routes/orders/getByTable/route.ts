import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/backend/lib/supabase";
import { z } from "zod";

export const getOrderByTableProcedure = publicProcedure
  .input(z.object({ tableNumber: z.number() }))
  .query(async ({ input }) => {
    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          menu_item:menu_items (
            id,
            name,
            price
          )
        )
      `)
      .eq("table_number", input.tableNumber)
      .in("status", ["pending", "preparing", "ready"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to fetch order: ${error.message}`);
    }

    return order || null;
  });
