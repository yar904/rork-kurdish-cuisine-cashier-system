import { publicProcedure } from "../../../create-context.js";
import { supabase } from "../../../../../lib/supabase.js";
import { z } from "zod";

export const createEmployeeProcedure = publicProcedure
  .input(
    z.object({
      name: z.string(),
      role: z.string(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      hourlyRate: z.number(),
    })
  )
  .mutation(async ({ input }: { input: { name: string; role: string; phone?: string; email?: string; hourlyRate: number } }) => {
    const { data, error } = await supabase
      .from("employees")
      .insert({
        name: input.name,
        role: input.role,
        phone: input.phone || null,
        email: input.email || null,
        hourly_rate: input.hourlyRate,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating employee:", error);
      throw new Error("Failed to create employee");
    }

    return data;
  });
