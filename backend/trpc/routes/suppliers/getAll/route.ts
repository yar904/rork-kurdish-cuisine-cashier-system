import { publicProcedure } from "../../../create-context.js";
import { supabase } from "../../../../../lib/supabase.js";

export const getAllSuppliersProcedure = publicProcedure.query(async () => {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching suppliers:", error);
    throw new Error("Failed to fetch suppliers");
  }

  return data;
});
