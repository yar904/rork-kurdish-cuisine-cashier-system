import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { supabase } from "../../../lib/supabase";

export const reportsSummaryProcedure = publicProcedure
  .input(
    z.object({
      startDate: z.string(),
      endDate: z.string(),
    })
  )
  .query(async ({ input }) => {
    const { startDate, endDate } = input;

    const { data: orders, error } = await supabase
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
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders for report:', error);
      throw new Error('Failed to fetch report data');
    }

    const { data: menuItems } = await supabase.from('menu_items').select('*');

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const paidOrders = orders.filter(o => o.status === 'paid');
    const paidRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

    const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    const categorySales: Record<string, number> = {};
    const hourlySales: Record<string, number> = {};
    const dailySales: Record<string, { revenue: number; orders: number }> = {};

    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const hour = orderDate.getHours();
      const day = orderDate.toISOString().split('T')[0];

      hourlySales[hour] = (hourlySales[hour] || 0) + order.total;
      
      if (!dailySales[day]) {
        dailySales[day] = { revenue: 0, orders: 0 };
      }
      dailySales[day].revenue += order.total;
      dailySales[day].orders += 1;

      (order.order_items as any[])?.forEach(item => {
        const menuItem = menuItems?.find(mi => mi.id === item.menu_item_id);
        if (!menuItem) return;

        if (!itemSales[menuItem.id]) {
          itemSales[menuItem.id] = {
            name: menuItem.name,
            quantity: 0,
            revenue: 0,
          };
        }
        itemSales[menuItem.id].quantity += item.quantity;
        itemSales[menuItem.id].revenue += menuItem.price * item.quantity;

        categorySales[menuItem.category] = (categorySales[menuItem.category] || 0) + (menuItem.price * item.quantity);
      });
    });

    const topItems = Object.entries(itemSales)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(([id, data]) => ({ id, ...data }));

    const categoryBreakdown = Object.entries(categorySales)
      .sort((a, b) => b[1] - a[1])
      .map(([category, revenue]) => ({
        category,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      }));

    const statusBreakdown = {
      new: orders.filter(o => o.status === 'new').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      served: orders.filter(o => o.status === 'served').length,
      paid: orders.filter(o => o.status === 'paid').length,
    };

    const peakHours = Object.entries(hourlySales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, revenue]) => ({
        hour: parseInt(hour),
        revenue,
      }));

    return {
      period: { startDate, endDate },
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        paidRevenue,
        paidOrders: paidOrders.length,
      },
      topItems,
      categoryBreakdown,
      statusBreakdown,
      peakHours,
      dailySales: Object.entries(dailySales)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      hourlySales: Object.entries(hourlySales)
        .map(([hour, revenue]) => ({ hour: parseInt(hour), revenue }))
        .sort((a, b) => a.hour - b.hour),
    };
  });
