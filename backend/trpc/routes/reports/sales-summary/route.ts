import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/backend/lib/supabase";
import type { Database } from "@/types/database";

type SalesSummaryRow = Database['public']['Views']['v_sales_summary']['Row'];

export const salesSummaryProcedure = publicProcedure.query(async () => {
  try {
    const { data, error } = await supabase
      .from('v_sales_summary')
      .select('*')
      .returns<SalesSummaryRow[]>();

    if (error) {
      console.error('Error fetching sales summary:', error);
      throw new Error(`Failed to fetch sales summary: ${error.message}`);
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error('Unexpected error in salesSummaryProcedure:', err);
    throw new Error('Failed to fetch sales summary');
  }
});
