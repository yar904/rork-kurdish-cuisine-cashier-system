import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchRequestHandler } from "npm:@trpc/server@10.45.0/adapters/fetch";
import { appRouter } from "./router.ts";
import { createContext } from "../_shared/trpc-context.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-trpc-source",
  "Access-Control-Allow-Credentials": "true",
};

serve(async (req) => {
  const { pathname } = new URL(req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (pathname.endsWith("/health")) {
    return new Response(JSON.stringify({ status: "ok", path: pathname }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return fetchRequestHandler({
    endpoint: "/trpc",
    req,
    router: appRouter,
    createContext,
    responseMeta() {
      return { headers: corsHeaders };
    },
  });
});
