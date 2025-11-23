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
export const getTrpcBaseUrl = () => {
  const functionUrl = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
  if (!functionUrl) {
    console.error("[tRPC] Missing EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL environment variable");
    throw new Error("Missing EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL environment variable. Please check your .env file.");
  }
  const url = `${functionUrl}/tapse-backend/trpc`;
  console.log("[tRPC] Using URL:", url);
  return url;
};

const getAuthorizationHeader = async () => {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    console.log("[tRPC Auth] Using user access token");
    headers["Authorization"] = `Bearer ${token}`;
  } else if (anonKey) {
    console.log("[tRPC Auth] Using anon key");
    headers["Authorization"] = `Bearer ${anonKey}`;
  } else {
    console.warn("[tRPC Auth] No authentication available");
  }

  return headers;
};

export const createTrpcHttpLink = () =>
  httpBatchLink({
    url: getTrpcBaseUrl(),
    headers: getAuthorizationHeader,
    transformer: trpcTransformer,
    fetch(requestUrl, options) {
      console.log("[tRPC] Fetching:", requestUrl);
      return fetch(requestUrl, {
        ...options,
        credentials: "omit",
      }).catch((error: any) => {
        console.error("[tRPC fetch error]", {
          url: requestUrl,
          method: options?.method ?? "POST",
          body: options?.body,
          error: error?.message || error,
          stack: error?.stack,
        });
        throw new Error(`tRPC fetch failed: ${error?.message || "Unknown error"}. Check that your backend is running and EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL is set correctly.`);
      });
    },
  });

export const trpcClient = createTRPCClient<AppRouter>({
  links: [createTrpcHttpLink()],
});
