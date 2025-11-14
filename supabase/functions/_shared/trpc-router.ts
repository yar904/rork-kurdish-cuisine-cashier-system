import { initTRPC } from "npm:@trpc/server@10.45.0";
import superjson from "npm:superjson@2.2.1";
import type { Context } from "./trpc-context.ts";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export { t };
