// tRPC client configuration
// Uses EXPO_PUBLIC_TRPC_URL to reach the Supabase Edge Function endpoint.
// Expected final URL: https://oqspnszwjxzyvwqjvjiy.functions.supabase.co/tapse-backend/trpc
// Centralized here to avoid previous "Failed to fetch" issues caused by mismatched hosts/paths.
import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { supabase } from "./supabase";
import type { AppRouter } from "@/types/trpc";

export const trpc = createTRPCReact<AppRouter>();
export const trpcTransformer = superjson;

// ---------- FINAL TRPC URL – ALWAYS USE THIS ----------
export const getTrpcBaseUrl = () =>
  "https://oqspnszwjxzyvwqjvjiy.functions.supabase.co/tapse-backend/trpc";

const getAuthorizationHeader = async () => {
  const session = await supabase.auth.getSession();
  const token =
    session.data.session?.access_token ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export const createTrpcHttpLink = () =>
  httpBatchLink({
    url: getTrpcBaseUrl(),
    headers: getAuthorizationHeader,
    onError({ error, meta }) {
      console.error("[tRPC link error]", {
        url: getTrpcBaseUrl(),
        path: meta?.path,
        type: meta?.type,
        error: error.message,
      });
    },
    fetch(requestUrl, options) {
      return fetch(requestUrl, {
        ...options,
        credentials: "omit",
      }).catch((error) => {
        console.error("[tRPC fetch error]", {
          url: requestUrl,
          method: options?.method ?? "POST",
          body: options?.body,
          error,
        });
        throw error;
      });
    },
  });

export const trpcClient = createTRPCClient<AppRouter>({
  transformer: trpcTransformer,
  links: [createTrpcHttpLink()],
});
