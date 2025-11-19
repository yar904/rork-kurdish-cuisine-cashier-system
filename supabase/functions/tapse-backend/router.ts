import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "./_shared/trpc-context.ts";
import { appRouter } from "./_shared/trpc-router.ts";
import { supabase } from "./_shared/supabase.ts";

const TRPC_ENDPOINT = "/tapse-backend";

function maybeHandleHealthCheck(request: Request): Response | null {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === `${TRPC_ENDPOINT}/health`) {
    return new Response(
      JSON.stringify({
        status: "ok",
        supabase: {
          projectUrl: Deno.env.get("SUPABASE_URL") ?? null,
          clientInitialized: Boolean(supabase),
        },
      }),
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }

  return null;
}

export function handleRequest(request: Request): Promise<Response> {
  const healthResponse = maybeHandleHealthCheck(request);
  if (healthResponse) {
    return Promise.resolve(healthResponse);
  }

  return fetchRequestHandler({
    endpoint: TRPC_ENDPOINT,
    req: request,
    router: appRouter,
    createContext: () => createTRPCContext(request),
  });
}
