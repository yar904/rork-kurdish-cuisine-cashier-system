import { publicProcedure } from "../../../create-context.js";
import { supabase } from "../../../../../lib/supabase.js";

export const getAllInventoryProcedure = publicProcedure.query(async () => {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*, suppliers(name)")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching inventory:", error);
    throw new Error("Failed to fetch inventory");
  }

  return data;
});
