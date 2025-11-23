import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/backend/lib/supabase";
import type { Database } from "@/types/database";

type SalesDailyRow = Database['public']['Views']['v_sales_daily']['Row'];

export const salesDailyProcedure = publicProcedure.query(async () => {
  try {
    const { data, error } = await supabase
      .from('v_sales_daily')
      .select('*')
      .order('sale_date', { ascending: false })
      .returns<SalesDailyRow[]>();

    if (error) {
      console.error('Error fetching daily sales data:', error);
      throw new Error(`Failed to fetch daily sales: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error in salesDailyProcedure:', err);
    throw new Error('Failed to fetch daily sales data');
  }
});
