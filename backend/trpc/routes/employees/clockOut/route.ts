import { publicProcedure } from "../../../create-context";
<<<<<<< HEAD
import { supabase } from "@/lib/supabase";
=======
import { supabase } from "@/backend/lib/supabase";
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
import { z } from "zod";

export const clockOutProcedure = publicProcedure
  .input(
    z.object({
      employeeId: z.string(),
      breakMinutes: z.number().optional(),
    })
  )
<<<<<<< HEAD
  .mutation(async ({ input }: { input: { employeeId: string; breakMinutes?: number } }) => {
=======
  .mutation(async ({ input }) => {
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
    const { data: existingRecord } = await supabase
      .from("clock_records")
      .select("*")
      .eq("employee_id", input.employeeId)
      .is("clock_out", null)
      .order("clock_in", { ascending: false })
      .limit(1)
      .single();

    if (!existingRecord) {
      throw new Error("No active clock-in record found");
    }

    const { data, error } = await supabase
      .from("clock_records")
      .update({
        clock_out: new Date().toISOString(),
        break_minutes: input.breakMinutes || 0,
      })
      .eq("id", existingRecord.id)
      .select()
      .single();

    if (error) {
      console.error("Error clocking out:", error);
      throw new Error("Failed to clock out");
    }

    return data;
  });
