import { publicProcedure } from "../../../../create-context.js";
import { supabase } from "../../../../../lib/supabase.js";
import { z } from "zod";

export default publicProcedure
  .input(
    z.object({
      orderId: z.string(),
      status: z.enum(['new', 'preparing', 'ready', 'served', 'paid']),
    })
  )
  .mutation(async ({ input }) => {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.orderId)
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error updating order status:', orderError);
      throw new Error('Failed to update order status');
    }

    if (input.status === 'paid') {
      const { error: tableError } = await supabase
        .from('tables')
        .update({
          status: 'needs-cleaning',
          current_order_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('number', order.table_number);

      if (tableError) {
        console.error('Error updating table after payment:', tableError);
      }
    }

    return { success: true };
  });
