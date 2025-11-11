import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { supabase } from '@/backend/lib/supabase';

export const createServiceRequestProcedure = publicProcedure
  .input(
    z.object({
      tableNumber: z.number(),
      requestType: z.enum(['waiter', 'bill', 'assistance']),
      messageText: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { tableNumber, requestType, messageText } = input;

    console.log(`Creating service request: ${requestType} for table ${tableNumber}`);

    const { data, error } = await supabase
      .from('service_requests')
      .insert({
        table_number: tableNumber,
        request_type: requestType,
        status: 'pending',
        message_text: messageText || '',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating service request:', error);
      throw new Error('Failed to send service request');
    }

    console.log(`✅ Service request created successfully: ${data.id}`);
    return { success: true };
  });
