import { publicProcedure } from "../../../create-context";
<<<<<<< HEAD
import { supabase } from "@/lib/supabase";
=======
import { supabase } from "@/backend/lib/supabase";
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
import { z } from "zod";

export const deleteEmployeeProcedure = publicProcedure
  .input(z.object({ id: z.string() }))
<<<<<<< HEAD
  .mutation(async ({ input }: { input: { id: string } }) => {
=======
  .mutation(async ({ input }) => {
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
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
