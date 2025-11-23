import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/backend/lib/supabase";
import type { Database } from "@/types/database";

type ActiveTablesRow = Database['public']['Views']['v_active_tables']['Row'];

export const activeTablesProcedure = publicProcedure.query(async () => {
  try {
    const { data, error } = await supabase
      .from('v_active_tables')
      .select('*')
      .order('table_number', { ascending: true })
      .returns<ActiveTablesRow[]>();

    if (error) {
      console.error('Error fetching active tables:', error);
      throw new Error(`Failed to fetch active tables: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error('Unexpected error in activeTablesProcedure:', err);
    throw new Error('Failed to fetch active tables');
  }
});
