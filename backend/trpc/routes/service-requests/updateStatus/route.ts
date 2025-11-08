import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';

export const updateServiceRequestStatusProcedure = publicProcedure
  .input(
    z.object({
      requestId: z.string(),
      status: z.enum(['pending', 'in-progress', 'resolved']),
      resolvedBy: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { requestId, status, resolvedBy } = input;

    const updateData: any = {
      status,
    };

    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = resolvedBy || null;
    }

    const { error } = await supabase
      .from('table_service_requests')
      .update(updateData)
      .eq('id', requestId);

    if (error) {
      console.error('Error updating service request:', error);
      throw new Error('Failed to update service request');
    }

    console.log(`Service request ${requestId} updated to ${status}`);
    return { success: true };
  });
