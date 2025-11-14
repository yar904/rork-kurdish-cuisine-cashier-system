import { publicProcedure } from "../../../create-context";
import { supabase } from "../../../lib/supabase";
import { z } from "zod";

export default publicProcedure
  .input(
    z.object({
      tableNumber: z.number(),
      status: z.enum(['available', 'occupied', 'reserved', 'needs-cleaning']),
    })
  )
  .mutation(async ({ input }) => {
    const { error } = await supabase
      .from('tables')
      .update({
        status: input.status,
        last_cleaned: input.status === 'available' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('number', input.tableNumber);

    if (error) {
      console.error('Error updating table status:', error);
      throw new Error('Failed to update table status');
    }

    return { success: true };
  });
