import { publicProcedure } from "../../../create-context";
<<<<<<< HEAD
import { supabase } from "@/lib/supabase";
=======
import { supabase } from "@/backend/lib/supabase";
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3

export const getLowStockProcedure = publicProcedure.query(async () => {
  const { data: allItems, error } = await supabase
    .from("inventory_items")
    .select("*, suppliers(name)");

  if (error) {
    console.error("Error fetching inventory items:", error);
    throw new Error("Failed to fetch inventory items");
  }

  const data = allItems.filter(item => item.current_stock < item.minimum_stock)
    .sort((a, b) => a.current_stock - b.current_stock);

  if (error) {
    console.error("Error fetching low stock items:", error);
    throw new Error("Failed to fetch low stock items");
  }

  return data;
});
