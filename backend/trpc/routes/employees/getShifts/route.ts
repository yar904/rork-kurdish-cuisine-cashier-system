import { publicProcedure } from "../../../create-context";
<<<<<<< HEAD
import { supabase } from "@/lib/supabase";
=======
import { supabase } from "@/backend/lib/supabase";
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
import { z } from "zod";

export const getShiftsProcedure = publicProcedure
  .input(
    z.object({
      employeeId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
<<<<<<< HEAD
  .query(async ({ input }: { input: { employeeId?: string; startDate?: string; endDate?: string } }) => {
=======
  .query(async ({ input }) => {
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
    let query = supabase
      .from("shifts")
      .select("*, employees(name, role)")
      .order("shift_date", { ascending: true });

    if (input.employeeId) {
      query = query.eq("employee_id", input.employeeId);
    }

    if (input.startDate) {
      query = query.gte("shift_date", input.startDate);
    }

    if (input.endDate) {
      query = query.lte("shift_date", input.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching shifts:", error);
      throw new Error("Failed to fetch shifts");
    }

    return data;
  });
