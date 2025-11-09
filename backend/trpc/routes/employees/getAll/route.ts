import { publicProcedure } from "../../../create-context.js";
import { supabase } from "../../../../../lib/supabase.js";

export const getAllEmployeesProcedure = publicProcedure.query(async () => {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching employees:", error);
    throw new Error("Failed to fetch employees");
  }

  return data;
});
