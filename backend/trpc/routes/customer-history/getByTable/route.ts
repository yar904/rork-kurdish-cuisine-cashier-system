import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { supabase } from '../../../lib/supabase';

export const getCustomerOrderHistoryProcedure = publicProcedure
  .input(
    z.object({
      tableNumber: z.number(),
    })
  )
  .query(async ({ input }) => {
    const { tableNumber } = input;

    const { data, error } = await supabase
      .from('customer_order_history')
      .select('*')
      .eq('table_number', tableNumber)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching order history:', error);
      throw new Error('Failed to fetch order history');
    }

    return data.map((record) => ({
      id: record.id,
      tableNumber: record.table_number,
      orderId: record.order_id,
      orderData: record.order_data,
      createdAt: new Date(record.created_at),
    }));
  });
