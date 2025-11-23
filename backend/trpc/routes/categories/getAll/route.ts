import { publicProcedure } from "../../../create-context";
import { supabase } from "../../../../lib/supabase";

export const getAllCategoriesProcedure = publicProcedure.query(async () => {
  const { data: menuItems, error } = await supabase
    .from("menu_items")
    .select("category")
    .order("category");

  if (error) {
    console.error("Error fetching categories:", error);
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  const uniqueCategories = Array.from(
    new Set(menuItems?.map((item) => item.category) || [])
  ).map((category) => ({
    name: category,
    itemCount: menuItems?.filter((item) => item.category === category).length || 0,
  }));

  return uniqueCategories.sort((a, b) => a.name.localeCompare(b.name));
});

export default getAllCategoriesProcedure;
