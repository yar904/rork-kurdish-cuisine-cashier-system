import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/backend/lib/supabase";
import type { Database } from "@/types/database";

type SalesMonthlyRow = Database['public']['Views']['v_sales_monthly']['Row'];

export const salesMonthlyProcedure = publicProcedure.query(async () => {
  try {
    const { data, error } = await supabase
      .from('v_sales_monthly')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .returns<SalesMonthlyRow[]>();

    if (error) {
      console.error('Error fetching monthly sales data:', error);
      throw new Error(`Failed to fetch monthly sales: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error in salesMonthlyProcedure:', err);
    throw new Error('Failed to fetch monthly sales data');
  }
});
