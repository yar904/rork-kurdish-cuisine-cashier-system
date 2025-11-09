import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/backend/lib/supabase";

export default publicProcedure.query(async () => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('category', { ascending: true });

  if (error) {
    console.error('Error fetching menu items:', error);
    throw new Error('Failed to fetch menu items');
  }

  return data.map(item => ({
    id: item.id,
    name: item.name,
    nameKurdish: item.name_kurdish,
    nameArabic: item.name_arabic,
    category: item.category,
    price: item.price,
    description: item.description,
    descriptionKurdish: item.description_kurdish,
    descriptionArabic: item.description_arabic,
    image: item.image,
    available: item.available,
  }));
});
