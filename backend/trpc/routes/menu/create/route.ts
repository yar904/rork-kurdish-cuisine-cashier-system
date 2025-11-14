import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { supabase } from "../../../lib/supabase";

const createMenuItemSchema = z.object({
  name: z.string().optional().default(""),
  nameKurdish: z.string().min(1, "Kurdish name is required"),
  nameArabic: z.string().optional().default(""),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be positive"),
  description: z.string().optional().default(""),
  descriptionKurdish: z.string().min(1, "Kurdish description is required"),
  descriptionArabic: z.string().optional().default(""),
  image: z.string().nullable().optional(),
  available: z.boolean().default(true),
});

export const createMenuItemProcedure = publicProcedure
  .input(createMenuItemSchema)
  .mutation(async ({ input }) => {
    const name = input.name || input.nameKurdish;
    const nameArabic = input.nameArabic || input.nameKurdish;
    const description = input.description || input.descriptionKurdish;
    const descriptionArabic = input.descriptionArabic || input.descriptionKurdish;

    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        name,
        name_kurdish: input.nameKurdish,
        name_arabic: nameArabic,
        category: input.category,
        price: input.price,
        description,
        description_kurdish: input.descriptionKurdish,
        description_arabic: descriptionArabic,
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
