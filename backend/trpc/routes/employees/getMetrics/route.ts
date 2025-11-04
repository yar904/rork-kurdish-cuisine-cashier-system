import { publicProcedure } from "../../../create-context.js";
import { supabase } from "../../../../../lib/supabase.js";
import { z } from "zod";

export const getEmployeeMetricsProcedure = publicProcedure
  .input(
    z.object({
      employeeId: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .query(async ({ input }: { input: { employeeId: string; startDate?: string; endDate?: string } }) => {
    let query = supabase
      .from("clock_records")
      .select("*")
      .eq("employee_id", input.employeeId)
      .not("clock_out", "is", null);

    if (input.startDate) {
      query = query.gte("clock_in", input.startDate);
    }

    if (input.endDate) {
      query = query.lte("clock_in", input.endDate);
    }

    const { data: clockRecords, error } = await query;

    if (error) {
      console.error("Error fetching clock records for metrics:", error);
      throw new Error("Failed to fetch employee metrics");
    }

    const totalHours = clockRecords.reduce((acc: number, record: any) => {
      const clockIn = new Date(record.clock_in).getTime();
      const clockOut = new Date(record.clock_out!).getTime();
      const hoursWorked = (clockOut - clockIn) / (1000 * 60 * 60);
      const breakHours = record.break_minutes / 60;
      return acc + hoursWorked - breakHours;
    }, 0);

    const { data: employee } = await supabase
      .from("employees")
      .select("hourly_rate")
      .eq("id", input.employeeId)
      .single();

    const totalEarnings = totalHours * (employee?.hourly_rate || 0);

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      totalDays: clockRecords.length,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      averageHoursPerDay:
        clockRecords.length > 0
          ? Math.round((totalHours / clockRecords.length) * 100) / 100
          : 0,
    };
  });
