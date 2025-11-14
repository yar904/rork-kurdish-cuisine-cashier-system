import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchRequestHandler } from "npm:@trpc/server@10.45.0/adapters/fetch";
import { createContext } from "../_shared/trpc-context.ts";
import { appRouter } from "./router.ts";

console.log("[Supabase Edge] Function starting...");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-trpc-source",
  "Access-Control-Allow-Credentials": "true",
};

serve(async (req: Request) => {
  const url = new URL(req.url);
  console.log("[Supabase Edge] Request received:", req.method, url.pathname);

  if (req.method === "OPTIONS") {
    console.log("[Supabase Edge] Handling CORS preflight");
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (url.pathname === "/health" || url.pathname === "/tapse-backend/health") {
    console.log("[Supabase Edge] Health check requested");
    return new Response(
      JSON.stringify({
        status: "ok",
        source: "supabase-edge",
        timestamp: new Date().toISOString(),
        path: url.pathname,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  if (url.pathname.startsWith("/trpc") || url.pathname.includes("/trpc/")) {
    console.log("[Supabase Edge] tRPC request:", req.method, url.pathname);

    try {
      const response = await fetchRequestHandler({
        endpoint: "/trpc",
        req,
        router: appRouter,
        createContext,
      });

      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    } catch (error) {
      console.error("[Supabase Edge] tRPC Error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
  }

  console.log("[Supabase Edge] Unknown route:", url.pathname);
  return new Response(
    JSON.stringify({
      status: "ok",
      message: "Tapse Backend - Supabase Edge Function",
      version: "1.0.0",
      endpoints: {
        health: "/health",
        trpc: "/trpc/*",
      },
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
});
