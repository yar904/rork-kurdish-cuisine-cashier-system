import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

const createMenuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameKurdish: z.string().min(1, "Kurdish name is required"),
  nameArabic: z.string().min(1, "Arabic name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be positive"),
  description: z.string().min(1, "Description is required"),
  descriptionKurdish: z.string().min(1, "Kurdish description is required"),
  descriptionArabic: z.string().min(1, "Arabic description is required"),
  image: z.string().nullable().optional(),
  available: z.boolean().default(true),
});

export const createMenuItemProcedure = publicProcedure
  .input(createMenuItemSchema)
  .mutation(async ({ input }) => {
    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        name: input.name,
        name_kurdish: input.nameKurdish,
        name_arabic: input.nameArabic,
        category: input.category,
        price: input.price,
        description: input.description,
        description_kurdish: input.descriptionKurdish,
        description_arabic: input.descriptionArabic,
        image: input.image || null,
        available: input.available,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating menu item:", error);
      throw new Error("Failed to create menu item");
    }

    return data;
  });

export default createMenuItemProcedure;
