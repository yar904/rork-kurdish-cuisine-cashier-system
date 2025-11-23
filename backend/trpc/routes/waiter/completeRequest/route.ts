import { publicProcedure } from "@/backend/trpc/create-context";
import { supabase } from "@/backend/lib/supabase";
import { z } from "zod";

export const completeRequestProcedure = publicProcedure
  .input(
    z.object({
      requestId: z.string(),
      resolvedBy: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { error } = await supabase
      .from('service_requests')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: input.resolvedBy || 'staff',
      })
      .eq('id', input.requestId);

    if (error) {
      console.error('[Waiter CompleteRequest] Error completing request:', error);
      throw new Error('Failed to complete service request');
    }

    return { success: true };
  });
