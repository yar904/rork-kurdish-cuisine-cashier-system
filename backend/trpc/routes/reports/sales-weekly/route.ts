import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/backend/lib/supabase";
import type { Database } from "@/types/database";

type SalesWeeklyRow = Database['public']['Views']['v_sales_weekly']['Row'];

export const salesWeeklyProcedure = publicProcedure.query(async () => {
  try {
    const { data, error } = await supabase
      .from('v_sales_weekly')
      .select('*')
      .order('week_start', { ascending: false })
      .returns<SalesWeeklyRow[]>();

    if (error) {
      console.error('Error fetching weekly sales data:', error);
      throw new Error(`Failed to fetch weekly sales: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error in salesWeeklyProcedure:', err);
    throw new Error('Failed to fetch weekly sales data');
  }
});
