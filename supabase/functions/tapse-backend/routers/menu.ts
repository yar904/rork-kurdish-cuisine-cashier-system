import { z } from "npm:zod";
import { publicProcedure, router } from "../trpc.ts";

export const menuRouter = router({
  categoriesWithItems: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("menu_categories")
      .select("id,name,description,position,menu_items(id,name,description,price,is_available,image_url)")
      .order("position", { ascending: true })
      .order("name", { foreignTable: "menu_items" });
    if (error) throw error;
    return data;
  }),
  search: publicProcedure
    .input(z.object({ term: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from("menu_items")
        .select("id,name,description,price,is_available,image_url")
        .ilike("name", `%${input.term}%`)
        .limit(20);
      if (error) throw error;
      return data;
    }),
  toggleAvailability: publicProcedure
    .input(z.object({ itemId: z.number(), isAvailable: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from("menu_items")
        .update({ is_available: input.isAvailable, updated_at: new Date().toISOString() })
        .eq("id", input.itemId)
        .select("id,name,is_available")
        .single();
      if (error) throw error;
      return data;
    })
});
