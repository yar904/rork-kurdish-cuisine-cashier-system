import { publicProcedure } from "../../../create-context.js";
import { supabase } from "../../../../../lib/supabase.js";
import { z } from "zod";

export const getClockRecordsProcedure = publicProcedure
  .input(
    z.object({
      employeeId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    let query = supabase
      .from("clock_records")
      .select("*, employees(name, role)")
      .order("clock_in", { ascending: false });

    if (input.employeeId) {
      query = query.eq("employee_id", input.employeeId);
    }

    if (input.startDate) {
      query = query.gte("clock_in", input.startDate);
    }

    if (input.endDate) {
      query = query.lte("clock_in", input.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching clock records:", error);
      throw new Error("Failed to fetch clock records");
    }

    return data;
  });
