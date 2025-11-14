import { publicProcedure } from "../../../create-context";
import { supabase } from "../../../lib/supabase";

export default publicProcedure.query(async () => {
  console.log('[Tables GetAll] Fetching tables...');
  
  try {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('number', { ascending: true });

    if (error) {
      console.error('[Tables GetAll] Supabase error:', error);
      throw new Error(`Failed to fetch tables: ${error.message}`);
    }

    console.log('[Tables GetAll] ✅ Fetched', data?.length || 0, 'tables');

    return data.map(table => ({
      number: table.number,
      status: table.status,
      capacity: table.capacity,
      currentOrderId: table.current_order_id,
      reservedFor: table.reserved_for,
      lastCleaned: table.last_cleaned ? new Date(table.last_cleaned) : undefined,
    }));
  } catch (err) {
    console.error('[Tables GetAll] Unexpected error:', err);
    throw err;
  }
});
