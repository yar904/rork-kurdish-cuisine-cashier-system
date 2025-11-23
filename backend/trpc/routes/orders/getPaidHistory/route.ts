import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/backend/lib/supabase";
import { z } from "zod";

export const getPaidHistoryProcedure = publicProcedure
  .input(
    z.object({
      limit: z.number().optional().default(50),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
    }).optional()
  )
  .query(async ({ input }) => {
    const limit = input?.limit || 50;
    
    let query = supabase
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
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (input?.fromDate) {
      query = query.gte('created_at', input.fromDate);
    }

    if (input?.toDate) {
      query = query.lte('created_at', input.toDate);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error('[Orders GetPaidHistory] Error fetching paid orders:', ordersError);
      throw new Error('Failed to fetch paid orders');
    }

    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*');

    if (menuError) {
      console.error('[Orders GetPaidHistory] Error fetching menu items:', menuError);
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
          id: item.id,
          menuItem: menuItem ? {
            id: menuItem.id,
            name: menuItem.name,
            nameKurdish: menuItem.name_kurdish || menuItem.name,
            nameArabic: menuItem.name_arabic || menuItem.name,
            category: menuItem.category,
            price: menuItem.price,
            cost: menuItem.cost,
            description: menuItem.description || '',
            descriptionKurdish: menuItem.description_kurdish || '',
            descriptionArabic: menuItem.description_arabic || '',
            image: menuItem.image,
            available: menuItem.available,
          } : null,
          quantity: item.quantity,
          notes: item.notes,
        };
      }),
    }));
  });
