import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/backend/lib/supabase";
import type { Database } from "@/types/database";

type ItemSalesSummaryRow = Database['public']['Views']['v_item_sales_summary']['Row'];

export const itemSalesSummaryProcedure = publicProcedure.query(async () => {
  try {
    const { data, error } = await supabase
      .from('v_item_sales_summary')
      .select('*')
      .order('total_revenue', { ascending: false })
      .returns<ItemSalesSummaryRow[]>();

    if (error) {
      console.error('Error fetching item sales summary:', error);
      throw new Error(`Failed to fetch item sales summary: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error in itemSalesSummaryProcedure:', err);
    throw new Error('Failed to fetch item sales summary');
  }
});
