import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "../../../../lib/supabase";

export const createTableProcedure = publicProcedure
  .input(
    z.object({
      number: z.number().int().positive(),
      capacity: z.number().int().positive(),
      status: z.enum(["available", "occupied", "reserved", "needs_cleaning"]).default("available"),
    })
  )
  .mutation(async ({ input }) => {
    const { data: existing } = await supabase
      .from("tables")
      .select("number")
      .eq("number", input.number)
      .single();

    if (existing) {
      throw new Error(`Table ${input.number} already exists`);
    }

    const { data, error } = await supabase
      .from("tables")
      .insert({
        number: input.number,
        capacity: input.capacity,
        status: input.status,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating table:", error);
      throw new Error(`Failed to create table: ${error.message}`);
    }

    return data;
  });

export default createTableProcedure;
