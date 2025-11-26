import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { fetchRequestHandler } from "npm:@trpc/server/adapters/fetch";
import { appRouter } from "./router.ts";
import { createContext } from "./context.ts";

const handler = (req: Request) => {
  return fetchRequestHandler({
    endpoint: "/tapse-backend",
    req,
    router: appRouter,
    createContext: () => createContext({ req })
  });
};

serve(handler);
