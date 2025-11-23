// tRPC client configuration
// Uses EXPO_PUBLIC_TRPC_URL (preferred) to reach the Supabase Edge Function endpoint.
// Expected final URL: https://oqspnszwjxzyvwqjvjiy.functions.supabase.co/tapse-backend/trpc
// Centralized here to avoid previous "Failed to fetch" issues caused by mismatched hosts/paths.
import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { supabase } from "./supabase";
import type { AppRouter } from "@/types/trpc";

export const trpc = createTRPCReact<AppRouter>();
export const trpcTransformer = superjson;

const stripTrailingSlash = (value: string) => value.replace(/\/+$|$/, "");
let cachedTrpcUrl: string | null = null;

// ---------- FINAL TRPC URL – ALWAYS USE THIS ----------
export const getTrpcBaseUrl = () => {
  if (cachedTrpcUrl) {
    return cachedTrpcUrl;
  }

  const explicitUrl = process.env.EXPO_PUBLIC_TRPC_URL?.trim();
  if (explicitUrl) {
    cachedTrpcUrl = stripTrailingSlash(explicitUrl);
    console.log("[tRPC] Using explicit URL:", cachedTrpcUrl);
    return cachedTrpcUrl;
  }

  const functionUrl = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL?.trim();
  if (!functionUrl) {
    console.error("[tRPC] Missing EXPO_PUBLIC_TRPC_URL or EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL environment variable");
    throw new Error(
      "Missing EXPO_PUBLIC_TRPC_URL (preferred) or EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL environment variable. Please check your .env file.",
    );
  }

  cachedTrpcUrl = `${stripTrailingSlash(functionUrl)}/tapse-backend/trpc`;
  console.log("[tRPC] Using derived URL:", cachedTrpcUrl);
  return cachedTrpcUrl;
};

const getAuthorizationHeader = async () => {
  try {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (token) {
      console.log("[tRPC Auth] Using user access token");
      headers.Authorization = `Bearer ${token}`;
      return headers;
    }

    if (anonKey) {
      console.log("[tRPC Auth] Using anon key fallback");
      headers.Authorization = `Bearer ${anonKey}`;
      return headers;
    }

    console.warn("[tRPC Auth] Missing Supabase credentials; requests will be anonymous");
    return headers;
  } catch (error) {
    console.error("[tRPC Auth] Failed to resolve authorization header", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
};

export const createTrpcHttpLink = () =>
  httpBatchLink({
    url: getTrpcBaseUrl(),
    headers: getAuthorizationHeader,
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
        throw new Error(
          `tRPC fetch failed: ${error?.message || "Unknown error"}. Check that your backend is running and EXPO_PUBLIC_TRPC_URL is set correctly.`,
        );
      });
    },
  });

export const trpcClient = createTRPCClient<AppRouter>({
  links: [createTrpcHttpLink()],
});
