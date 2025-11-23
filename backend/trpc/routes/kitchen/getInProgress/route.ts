import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/backend/lib/supabase";

export const getInProgressOrdersProcedure = publicProcedure.query(async () => {
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
    .eq('status', 'preparing')
    .order('created_at', { ascending: true });

  if (ordersError) {
    console.error('[Kitchen GetInProgress] Error fetching in-progress orders:', ordersError);
    throw new Error('Failed to fetch in-progress orders');
  }

  const { data: menuItems, error: menuError } = await supabase
    .from('menu_items')
    .select('*');

  if (menuError) {
    console.error('[Kitchen GetInProgress] Error fetching menu items:', menuError);
    throw new Error('Failed to fetch menu items');
  }

  return orders.map(order => ({
    id: order.id,
    tableNumber: order.table_number,
    status: order.status,
    waiterName: order.waiter_name,
    total: order.total,
    createdAt: new Date(order.created_at),
    updatedAt: new Date(order.updated_at),
    items: (order.order_items as any[]).map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menu_item_id);
      return {
        id: item.id,
        menuItem: menuItem ? {
          id: menuItem.id,
          name: menuItem.name,
          nameKurdish: menuItem.name_kurdish || menuItem.name,
          nameArabic: menuItem.name_arabic || menuItem.name,
          category: menuItem.category,
          price: menuItem.price,
          image: menuItem.image,
        } : null,
        quantity: item.quantity,
        notes: item.notes,
      };
    }),
  }));
});
