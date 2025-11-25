import { createTRPCClient, httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import type { AppRouter } from "@/types/trpc";

const TRPC_ENDPOINT = process.env.EXPO_PUBLIC_TRPC_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!TRPC_ENDPOINT) {
  throw new Error("EXPO_PUBLIC_TRPC_URL is required for tRPC connectivity.");
}

if (!SUPABASE_ANON_KEY) {
  throw new Error("EXPO_PUBLIC_SUPABASE_ANON_KEY is required for authenticated requests.");
}

export const TRPC_URL = TRPC_ENDPOINT;
export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = createTRPCClient<AppRouter>({
  transformer: superjson,
  links: [
    httpLink({
      url: TRPC_ENDPOINT,
      headers() {
        return {
          "Content-Type": "application/json",
          Accept: "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        };
      },
    }),
  ],
});
