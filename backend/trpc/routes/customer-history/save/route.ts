import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { supabase } from '@/backend/lib/supabase';

export const saveCustomerOrderHistoryProcedure = publicProcedure
  .input(
    z.object({
      tableNumber: z.number(),
      orderId: z.string(),
      orderData: z.object({
        id: z.string(),
        tableNumber: z.number(),
        items: z.array(z.any()),
        total: z.number(),
        status: z.string(),
        createdAt: z.string(),
      }),
    })
  )
  .mutation(async ({ input }) => {
    const { tableNumber, orderId, orderData } = input;

    const { data, error } = await supabase
      .from('customer_order_history')
      .insert({
        table_number: tableNumber,
        order_id: orderId,
        order_data: orderData,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving order history:', error);
      throw new Error('Failed to save order history');
    }

    console.log(`Order history saved for table ${tableNumber}, order ${orderId}`);
    return { historyId: data.id, success: true };
  });
