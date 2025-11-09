import { publicProcedure } from "../../../../create-context.js";
import { supabase } from "../../../../../lib/supabase.js";

export default publicProcedure.query(async () => {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .order('number', { ascending: true });

  if (error) {
    console.error('Error fetching tables:', error);
    throw new Error('Failed to fetch tables');
  }

  return data.map(table => ({
    number: table.number,
    status: table.status,
    capacity: table.capacity,
    currentOrderId: table.current_order_id,
    reservedFor: table.reserved_for,
    lastCleaned: table.last_cleaned ? new Date(table.last_cleaned) : undefined,
  }));
});
