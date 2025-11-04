import { publicProcedure } from "../../../create-context.js";
import { supabase } from "../../../../../lib/supabase.js";
import { z } from "zod";

export const clockInProcedure = publicProcedure
  .input(
    z.object({
      employeeId: z.string(),
    })
  )
  .mutation(async ({ input }: { input: { employeeId: string } }) => {
    const { data: existingRecord } = await supabase
      .from("clock_records")
      .select("*")
      .eq("employee_id", input.employeeId)
      .is("clock_out", null)
      .single();

    if (existingRecord) {
      throw new Error("Employee is already clocked in");
    }

    const { data, error } = await supabase
      .from("clock_records")
      .insert({
        employee_id: input.employeeId,
        clock_in: new Date().toISOString(),
        break_minutes: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error clocking in:", error);
      throw new Error("Failed to clock in");
    }

    return data;
  });
