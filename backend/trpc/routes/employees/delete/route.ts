import { publicProcedure } from "../../../create-context";
import { supabase } from "@/backend/lib/supabase";
import { z } from "zod";

export const deleteEmployeeProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input }) => {
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", input.id);

    if (error) {
      console.error("Error deleting employee:", error);
      throw new Error("Failed to delete employee");
    }

    return { success: true };
  });
