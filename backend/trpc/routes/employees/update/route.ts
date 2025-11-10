import { publicProcedure } from "../../../create-context.js";
import { supabase } from "../../../../../lib/supabase.js";
import { z } from "zod";

export const updateEmployeeProcedure = publicProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      role: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      hourlyRate: z.number().optional(),
      status: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.hourlyRate !== undefined) updateData.hourly_rate = input.hourlyRate;
    if (input.status !== undefined) updateData.status = input.status;

    const { data, error } = await supabase
      .from("employees")
      .update(updateData)
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating employee:", error);
      throw new Error("Failed to update employee");
    }

    return data;
  });
