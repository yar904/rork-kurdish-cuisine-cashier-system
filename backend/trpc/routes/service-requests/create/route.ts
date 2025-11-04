import { z } from 'zod';
import { publicProcedure } from '../../../create-context.js';
import { supabase } from '../../../../../lib/supabase.js';

export const createServiceRequestProcedure = publicProcedure
  .input(
    z.object({
      tableNumber: z.number(),
      requestType: z.enum(['waiter', 'bill', 'wrong-order']),
      message: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { tableNumber, requestType, message } = input;

    const { data, error } = await supabase
      .from('table_service_requests')
      .insert({
        table_number: tableNumber,
        request_type: requestType,
        status: 'pending',
        message: message || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating service request:', error);
      throw new Error('Failed to create service request');
    }

    console.log(`Service request created: ${requestType} for table ${tableNumber}`);
    return { requestId: data.id, success: true };
  });
