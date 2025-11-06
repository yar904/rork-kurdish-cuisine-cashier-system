import { publicProcedure } from "../../../create-context";
import { supabase } from "@/backend/lib/supabase";
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
  .mutation(async ({ input }) => {
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
