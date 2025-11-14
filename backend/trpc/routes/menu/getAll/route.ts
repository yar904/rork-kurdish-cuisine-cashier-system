import { publicProcedure } from "../../../create-context";
import { supabase } from "../../../lib/supabase";

export default publicProcedure.query(async () => {
  console.log('[Menu GetAll] Fetching menu items...');
  
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('[Menu GetAll] Supabase error:', error);
      throw new Error(`Failed to fetch menu items: ${error.message}`);
    }

    console.log('[Menu GetAll] ✅ Fetched', data?.length || 0, 'menu items');

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
  } catch (err) {
    console.error('[Menu GetAll] Unexpected error:', err);
    throw err;
  }
});
