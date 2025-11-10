import { publicProcedure } from "../../../create-context";
<<<<<<< HEAD
import { supabase } from "@/lib/supabase";
=======
import { supabase } from "@/backend/lib/supabase";
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
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
