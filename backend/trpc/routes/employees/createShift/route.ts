import { publicProcedure } from "../../../create-context";
<<<<<<< HEAD
import { supabase } from "@/lib/supabase";
=======
import { supabase } from "@/backend/lib/supabase";
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
import { z } from "zod";

export const createShiftProcedure = publicProcedure
  .input(
    z.object({
      employeeId: z.string(),
      shiftDate: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      notes: z.string().optional(),
    })
  )
<<<<<<< HEAD
  .mutation(async ({ input }: { input: { employeeId: string; shiftDate: string; startTime: string; endTime: string; notes?: string } }) => {
=======
  .mutation(async ({ input }) => {
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
    const { data, error } = await supabase
      .from("shifts")
      .insert({
        employee_id: input.employeeId,
        shift_date: input.shiftDate,
        start_time: input.startTime,
        end_time: input.endTime,
        notes: input.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating shift:", error);
      throw new Error("Failed to create shift");
    }

    return data;
  });
