import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "./_shared/trpc-context.ts";
import { appRouter } from "./_shared/trpc-router.ts";
import { supabase } from "./_shared/supabase.ts";

const BASE_PATH = "/tapse-backend";
const TRPC_ENDPOINT = `${BASE_PATH}/trpc`;

function maybeHandleHealthCheck(request: Request): Response | null {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === `${BASE_PATH}/health`) {
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

  // All TRPC calls require an Authorization header. When testing locally, pass the anon key:
  //   curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  //        -H "Content-Type: application/json" \
  //        --data '{"id":0,"method":"query","params":{"input":null,"path":"menu.getAll"}}' \
  //        https://opsqnzswjxzvywqjvjy.functions.supabase.co/tapse-backend/trpc
  return fetchRequestHandler({
    endpoint: TRPC_ENDPOINT,
    req: request,
    router: appRouter,
    createContext: () => createTRPCContext(request),
  });
}

export { appRouter } from "./_shared/trpc-router.ts";
export type { AppRouter } from "./_shared/trpc-router.ts";
