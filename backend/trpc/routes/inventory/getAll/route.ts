import { publicProcedure } from "../../../create-context";
<<<<<<< HEAD
import { supabase } from "@/lib/supabase";
=======
import { supabase } from "@/backend/lib/supabase";
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3

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
