import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { supabase } from "@/backend/lib/supabase";

export const reportsComparisonProcedure = publicProcedure
  .input(
    z.object({
      currentStartDate: z.string(),
      currentEndDate: z.string(),
      previousStartDate: z.string(),
      previousEndDate: z.string(),
    })
  )
  .query(async ({ input }) => {
    const { currentStartDate, currentEndDate, previousStartDate, previousEndDate } = input;

    const fetchPeriodData = async (startDate: string, endDate: string) => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw new Error('Failed to fetch comparison data');

      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = orders.length;
      const paidOrders = orders.filter(o => o.status === 'paid');
      const paidRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        paidRevenue,
        paidOrders: paidOrders.length,
      };
    };

    const currentData = await fetchPeriodData(currentStartDate, currentEndDate);
    const previousData = await fetchPeriodData(previousStartDate, previousEndDate);

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      current: currentData,
      previous: previousData,
      growth: {
        revenue: calculateGrowth(currentData.totalRevenue, previousData.totalRevenue),
        orders: calculateGrowth(currentData.totalOrders, previousData.totalOrders),
        averageOrderValue: calculateGrowth(currentData.averageOrderValue, previousData.averageOrderValue),
        paidRevenue: calculateGrowth(currentData.paidRevenue, previousData.paidRevenue),
      },
    };
  });
