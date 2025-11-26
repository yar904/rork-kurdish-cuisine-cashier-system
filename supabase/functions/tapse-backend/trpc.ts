import { initTRPC } from "npm:@trpc/server";
import SuperJSON from "npm:superjson";
import { Context } from "./context.ts";

const t = initTRPC.context<Context>().create({
  transformer: SuperJSON
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
