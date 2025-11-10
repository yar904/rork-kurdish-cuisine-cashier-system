import { publicProcedure } from "../../../../create-context.js";
import { supabase } from "../../../../../lib/supabase.js";

export default publicProcedure.query(async () => {
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        menu_item_id,
        quantity,
        notes
      )
    `)
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error('Error fetching orders:', ordersError);
    throw new Error('Failed to fetch orders');
  }

  const { data: menuItems, error: menuError } = await supabase
    .from('menu_items')
    .select('*');

  if (menuError) {
    console.error('Error fetching menu items:', menuError);
    throw new Error('Failed to fetch menu items');
  }

  return orders.map(order => ({
    id: order.id,
    tableNumber: order.table_number,
    status: order.status,
    waiterName: order.waiter_name,
    total: order.total,
    splitInfo: order.split_info,
    createdAt: new Date(order.created_at),
    updatedAt: new Date(order.updated_at),
    items: (order.order_items as any[]).map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menu_item_id);
      return {
        menuItem: menuItem ? {
          id: menuItem.id,
          name: menuItem.name,
          nameKurdish: menuItem.name_kurdish,
          nameArabic: menuItem.name_arabic,
          category: menuItem.category,
          price: menuItem.price,
          description: menuItem.description,
          descriptionKurdish: menuItem.description_kurdish,
          descriptionArabic: menuItem.description_arabic,
          image: menuItem.image,
          available: menuItem.available,
        } : null,
        quantity: item.quantity,
        notes: item.notes,
      };
    }).filter(item => item.menuItem !== null),
  }));
});
