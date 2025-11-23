// tRPC client configuration
// Uses EXPO_PUBLIC_TRPC_URL to reach the Supabase Edge Function endpoint.
// Expected final URL: https://oqspnszwjxzyvwqjvjiy.functions.supabase.co/tapse-backend/trpc
// Centralized here to avoid previous "Failed to fetch" issues caused by mismatched hosts/paths.
import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/types/trpc";
import superjson from "superjson";
import { supabase } from "./supabase";

const FALLBACK_TRPC_URL =
  "https://oqspnszwjxzyvwqjvjiy.functions.supabase.co/tapse-backend/trpc";

console.log("[ENV] TRPC:", process.env.EXPO_PUBLIC_TRPC_URL);
console.log("[ENV] Functions:", process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL);
console.log("[ENV] Supabase URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);

export const getTrpcBaseUrl = (): string => {
  const apiUrl = process.env.EXPO_PUBLIC_TRPC_URL?.replace(/\/$/, "");
  return apiUrl || FALLBACK_TRPC_URL;
};

export const trpc = createTRPCReact<AppRouter>();
export const trpcTransformer = superjson;

const getAuthorizationHeader = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const createTrpcHttpLink = (url = getTrpcBaseUrl()) =>
  httpBatchLink({
    url,
    headers: getAuthorizationHeader,
    onError({ error, meta }) {
      console.error("[tRPC link error]", {
        url,
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
