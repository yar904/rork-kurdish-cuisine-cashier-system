import { z } from "npm:zod";
import { publicProcedure, router } from "../trpc.ts";

const tableStatusSchema = z.enum(["available", "occupied", "dirty"]);

export const tablesRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase.from("tables").select("id,label,seats,status,qr_slug,updated_at").order("label");
    if (error) throw error;
    return data;
  }),
  bySlug: publicProcedure.input(z.object({ qrSlug: z.string() })).query(async ({ input, ctx }) => {
    const { data, error } = await ctx.supabase.from("tables").select("id,label,seats,status").eq("qr_slug", input.qrSlug).single();
    if (error) throw error;
    return data;
  }),
  updateStatus: publicProcedure
    .input(z.object({ tableId: z.number(), status: tableStatusSchema }))
    .mutation(async ({ input, ctx }) => {
      const { error, data } = await ctx.supabase
        .from("tables")
        .update({ status: input.status, updated_at: new Date().toISOString() })
        .eq("id", input.tableId)
        .select("id,label,status,updated_at")
        .single();
      if (error) throw error;
      return data;
    })
});
