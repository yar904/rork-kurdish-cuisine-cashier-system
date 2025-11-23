import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "../../../../lib/supabase";

export const deleteTableProcedure = publicProcedure
  .input(
    z.object({
      number: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const { data: table } = await supabase
      .from("tables")
      .select("current_order_id, status")
      .eq("number", input.number)
      .single();

    if (table?.current_order_id || table?.status === "occupied") {
      throw new Error(
        `Cannot delete table ${input.number} because it has an active order. Please complete the order first.`
      );
    }

    const { error } = await supabase
      .from("tables")
      .delete()
      .eq("number", input.number);

    if (error) {
      console.error("Error deleting table:", error);
      throw new Error(`Failed to delete table: ${error.message}`);
    }

    return {
      success: true,
      message: `Table ${input.number} deleted successfully`,
    };
  });

export default deleteTableProcedure;
