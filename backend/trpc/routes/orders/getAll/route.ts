import { publicProcedure } from "../../../create-context";
import { supabase } from "../../../lib/supabase";

export default publicProcedure.query(async () => {
  console.log('[Orders GetAll] Fetching orders...');
  
  try {
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
      console.error('[Orders GetAll] Error fetching orders:', ordersError);
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*');

    if (menuError) {
      console.error('[Orders GetAll] Error fetching menu items:', menuError);
      throw new Error(`Failed to fetch menu items: ${menuError.message}`);
    }

    console.log('[Orders GetAll] ✅ Fetched', orders?.length || 0, 'orders');

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
            nameKurdish: menuItem.name_kurdish || menuItem.name,
            nameArabic: menuItem.name_arabic || menuItem.name,
            category: menuItem.category,
            price: menuItem.price,
            cost: menuItem.cost,
            description: menuItem.description || '',
            descriptionKurdish: menuItem.description || '',
            descriptionArabic: menuItem.description || '',
            image: menuItem.image,
            available: menuItem.available,
          } : null,
          quantity: item.quantity,
          notes: item.notes,
        };
      }),
    }));
  } catch (err) {
    console.error('[Orders GetAll] Unexpected error:', err);
    throw err;
  }
});
