import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchRequestHandler } from "npm:@trpc/server@10.45.0/adapters/fetch";
import { createContext } from "../_shared/trpc-context.ts";
import { appRouter } from "./router.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-trpc-source",
};

serve(async (req: Request) => {
  const url = new URL(req.url);
  const { pathname } = url;

  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers: cors });
  }

  if (pathname.endsWith("/health")) {
    return new Response(
      JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  }

  const response = await fetchRequestHandler({
    endpoint: "/tapse-backend",
    req,
    router: appRouter,
    createContext,
  });

  const headers = new Headers(response.headers);
  Object.entries(cors).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
