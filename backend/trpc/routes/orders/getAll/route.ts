import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/backend/lib/supabase";

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
    console.error('[Orders GetAll] Error fetching orders:', ordersError);
    throw new Error('Failed to fetch orders');
  }

  const { data: menuItems, error: menuError } = await supabase
    .from('menu_items')
    .select('*');

  if (menuError) {
    console.error('[Orders GetAll] Error fetching menu items:', menuError);
    throw new Error('Failed to fetch menu items');
  }

  return orders.map(order => ({
    id: order.id,
    table_number: order.table_number,
    status: order.status,
    waiter_name: order.waiter_name,
    total: order.total,
    split_info: order.split_info,
    created_at: order.created_at,
    updated_at: order.updated_at,
    items: (order.order_items as any[]).map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menu_item_id);
      return {
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        notes: item.notes,
        menuItem: menuItem || null,
      };
    }),
  }));
});
