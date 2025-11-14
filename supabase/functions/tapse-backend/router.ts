import { createTRPCRouter, publicProcedure } from "../_shared/trpc-router.ts";
import { z } from "npm:zod@3.22.4";

// Placeholders – full logic comes in Prompt 2
export const exampleRouter = createTRPCRouter({
  hi: publicProcedure.input(z.object({ name: z.string() })).query(({ input }) => {
    return { hello: input.name };
  }),
});

export const appRouter = createTRPCRouter({
  example: exampleRouter,
});

export type AppRouter = typeof appRouter;
