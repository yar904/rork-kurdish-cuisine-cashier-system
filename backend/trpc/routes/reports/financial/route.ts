import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { supabase } from "../../../lib/supabase";

export const reportsFinancialProcedure = publicProcedure
  .input(
    z.object({
      startDate: z.string(),
      endDate: z.string(),
    })
  )
  .query(async ({ input }) => {
    const { startDate, endDate } = input;

    console.log('[Financial Report] Generating report for:', { startDate, endDate });

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
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('[Financial Report] Error fetching orders:', ordersError);
      throw new Error('Failed to fetch orders for financial report');
    }

    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*');

    if (menuError) {
      console.error('[Financial Report] Error fetching menu items:', menuError);
      throw new Error('Failed to fetch menu items');
    }

    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, name, role, hourly_rate');

    if (employeesError) {
      console.error('[Financial Report] Error fetching employees:', employeesError);
    }

    const { data: clockRecords, error: clockError } = await supabase
      .from('clock_records')
      .select('*')
      .gte('clock_in', startDate)
      .lte('clock_in', endDate);

    if (clockError) {
      console.error('[Financial Report] Error fetching clock records:', clockError);
    }

    let totalRevenue = 0;
    let totalCost = 0;
    let totalOrders = orders.length;

    const itemProfits: Record<string, {
      name: string;
      quantity: number;
      revenue: number;
      cost: number;
      profit: number;
      margin: number;
    }> = {};

    const categoryProfits: Record<string, {
      revenue: number;
      cost: number;
      profit: number;
      margin: number;
    }> = {};

    const dailyFinancials: Record<string, {
      revenue: number;
      cost: number;
      profit: number;
      orders: number;
    }> = {};

    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const day = orderDate.toISOString().split('T')[0];

      totalRevenue += order.total;

      if (!dailyFinancials[day]) {
        dailyFinancials[day] = { revenue: 0, cost: 0, profit: 0, orders: 0 };
      }
      dailyFinancials[day].revenue += order.total;
      dailyFinancials[day].orders += 1;

      (order.order_items as any[])?.forEach(item => {
        const menuItem = menuItems?.find(mi => mi.id === item.menu_item_id);
        if (!menuItem) return;

        const itemRevenue = menuItem.price * item.quantity;
        const itemCost = (menuItem.cost || 0) * item.quantity;
        const itemProfit = itemRevenue - itemCost;

        totalCost += itemCost;
        dailyFinancials[day].cost += itemCost;
        dailyFinancials[day].profit += itemProfit;

        if (!itemProfits[menuItem.id]) {
          itemProfits[menuItem.id] = {
            name: menuItem.name,
            quantity: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            margin: 0,
          };
        }

        itemProfits[menuItem.id].quantity += item.quantity;
        itemProfits[menuItem.id].revenue += itemRevenue;
        itemProfits[menuItem.id].cost += itemCost;
        itemProfits[menuItem.id].profit += itemProfit;
        itemProfits[menuItem.id].margin = 
          itemProfits[menuItem.id].revenue > 0 
            ? (itemProfits[menuItem.id].profit / itemProfits[menuItem.id].revenue) * 100 
            : 0;

        if (!categoryProfits[menuItem.category]) {
          categoryProfits[menuItem.category] = {
            revenue: 0,
            cost: 0,
            profit: 0,
            margin: 0,
          };
        }

        categoryProfits[menuItem.category].revenue += itemRevenue;
        categoryProfits[menuItem.category].cost += itemCost;
        categoryProfits[menuItem.category].profit += itemProfit;
        categoryProfits[menuItem.category].margin = 
          categoryProfits[menuItem.category].revenue > 0
            ? (categoryProfits[menuItem.category].profit / categoryProfits[menuItem.category].revenue) * 100
            : 0;
      });
    });

    const totalProfit = totalRevenue - totalCost;
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    let laborCost = 0;
    if (clockRecords && employees) {
      clockRecords.forEach(record => {
        if (!record.clock_out) return;
        
        const employee = employees.find(e => e.id === record.employee_id);
        if (!employee) return;

        const clockIn = new Date(record.clock_in);
        const clockOut = new Date(record.clock_out);
        const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
        const breakHours = (record.break_minutes || 0) / 60;
        const paidHours = hoursWorked - breakHours;
        
        laborCost += paidHours * employee.hourly_rate;
      });
    }

    const netProfit = totalProfit - laborCost;

    const topProfitableItems = Object.entries(itemProfits)
      .sort((a, b) => b[1].profit - a[1].profit)
      .slice(0, 10)
      .map(([id, data]) => ({ id, ...data }));

    const topMarginItems = Object.entries(itemProfits)
      .filter(([, data]) => data.quantity >= 3)
      .sort((a, b) => b[1].margin - a[1].margin)
      .slice(0, 10)
      .map(([id, data]) => ({ id, ...data }));

    const categoryBreakdown = Object.entries(categoryProfits)
      .sort((a, b) => b[1].profit - a[1].profit)
      .map(([category, data]) => ({
        category,
        ...data,
      }));

    const paidOrders = orders.filter(o => o.status === 'paid');
    const paidRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

    console.log('[Financial Report] Generated successfully:', {
      totalRevenue,
      totalProfit,
      overallMargin: overallMargin.toFixed(2) + '%',
    });

    return {
      period: { startDate, endDate },
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        netProfit,
        overallMargin,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        paidRevenue,
        paidOrders: paidOrders.length,
        laborCost,
      },
      topProfitableItems,
      topMarginItems,
      categoryBreakdown,
      dailyFinancials: Object.entries(dailyFinancials)
        .map(([date, data]) => ({
          date,
          ...data,
          margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  });
