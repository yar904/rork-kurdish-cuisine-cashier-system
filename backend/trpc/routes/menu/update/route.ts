import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { supabase } from "../../../lib/supabase";

const updateMenuItemSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required").optional(),
  nameKurdish: z.string().min(1, "Kurdish name is required").optional(),
  nameArabic: z.string().min(1, "Arabic name is required").optional(),
  category: z.string().min(1, "Category is required").optional(),
  price: z.number().min(0, "Price must be positive").optional(),
  description: z.string().min(1, "Description is required").optional(),
  descriptionKurdish: z.string().min(1, "Kurdish description is required").optional(),
  descriptionArabic: z.string().min(1, "Arabic description is required").optional(),
  image: z.string().nullable().optional(),
  available: z.boolean().optional(),
});

export const updateMenuItemProcedure = publicProcedure
  .input(updateMenuItemSchema)
  .mutation(async ({ input }: { input: z.infer<typeof updateMenuItemSchema> }) => {
    const { id, ...updateData } = input;

    const { data: currentItem, error: fetchError } = await supabase
      .from("menu_items")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !currentItem) {
      console.error("Error fetching menu item:", fetchError);
      throw new Error("Failed to fetch menu item");
    }

    const kurdishName = updateData.nameKurdish ?? currentItem.name_kurdish;

    const dbUpdateData: Record<string, any> = {};
    if (updateData.name !== undefined) dbUpdateData.name = updateData.name || kurdishName;
    if (updateData.nameKurdish !== undefined) dbUpdateData.name_kurdish = updateData.nameKurdish;
    if (updateData.nameArabic !== undefined) dbUpdateData.name_arabic = updateData.nameArabic || kurdishName;
    if (updateData.category !== undefined) dbUpdateData.category = updateData.category;
    if (updateData.price !== undefined) dbUpdateData.price = updateData.price;
    if (updateData.description !== undefined) dbUpdateData.description = updateData.description || (updateData.descriptionKurdish ?? currentItem.description_kurdish);
    if (updateData.descriptionKurdish !== undefined) dbUpdateData.description_kurdish = updateData.descriptionKurdish;
    if (updateData.descriptionArabic !== undefined) dbUpdateData.description_arabic = updateData.descriptionArabic || (updateData.descriptionKurdish ?? currentItem.description_kurdish);
    if (updateData.image !== undefined) dbUpdateData.image = updateData.image;
    if (updateData.available !== undefined) dbUpdateData.available = updateData.available;

    dbUpdateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("menu_items")
      .update(dbUpdateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating menu item:", error);
      throw new Error("Failed to update menu item");
    }

    return data;
  });

export default updateMenuItemProcedure;
