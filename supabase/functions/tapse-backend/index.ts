import { createTRPCContext } from "./_shared/trpc-context.ts";
import { appRouter } from "./_shared/trpc-router.ts";
import { supabase } from "./_shared/supabase.ts";
import { handleRequest } from "./router.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const warmupContext = createTRPCContext(
  new Request("https://tapse-backend.local/warmup", { headers: new Headers() }),
).catch(() => null);

console.log(
  `[tapse-backend] Loaded ${Object.keys(appRouter._def.procedures).length} procedures and awaiting context warmup.`,
);
console.log(`[tapse-backend] Supabase client initialized: ${Boolean(supabase)}`);

await warmupContext;

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const response = await handleRequest(request);
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
});
