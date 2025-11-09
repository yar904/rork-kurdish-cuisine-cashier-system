import { publicProcedure } from "../../../create-context.js";
import { supabase } from "../../../../../lib/supabase.js";
import { z } from "zod";

export const createSupplierProcedure = publicProcedure
  .input(
    z.object({
      name: z.string(),
      contactPerson: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      address: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { data, error } = await supabase
      .from("suppliers")
      .insert({
        name: input.name,
        contact_person: input.contactPerson || null,
        phone: input.phone || null,
        email: input.email || null,
        address: input.address || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating supplier:", error);
      throw new Error("Failed to create supplier");
    }

    return data;
  });
