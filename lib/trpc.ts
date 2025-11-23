// tRPC client configuration
// Uses EXPO_PUBLIC_TRPC_URL (preferred) to reach the Supabase Edge Function endpoint.
// Expected final URL: https://oqspnszwjxzyvwqjvjiy.functions.supabase.co/tapse-backend
// Centralized here to avoid previous "Failed to fetch" issues caused by mismatched hosts/paths.
import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
import superjson from "superjson";
import { supabase } from "./supabase";
import type { AppRouter } from "@/types/trpc";

export const trpc = createTRPCReact<AppRouter>();
export const trpcTransformer = superjson;

const TRPC_ENDPOINT_PATH = "/tapse-backend";
const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const ensureTrpcEndpoint = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const normalized = stripTrailingSlash(value.trim());
  if (!normalized) {
    return null;
  }

  if (normalized.endsWith(TRPC_ENDPOINT_PATH)) {
    return normalized;
  }

  return `${normalized}${TRPC_ENDPOINT_PATH}`;
};

const resolveSupabaseEdgeUrl = (): string => {
  const explicitUrl = ensureTrpcEndpoint(process.env.EXPO_PUBLIC_TRPC_URL);
  if (explicitUrl) {
    return explicitUrl;
  }

  const supabaseFunctionsUrl = ensureTrpcEndpoint(process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL);
  if (supabaseFunctionsUrl) {
    return supabaseFunctionsUrl;
  }

  const projectRef = process.env.EXPO_PUBLIC_SUPABASE_PROJECT_ID?.trim();
  if (projectRef) {
    const derivedUrl = ensureTrpcEndpoint(`https://${projectRef}.functions.supabase.co`);
    if (derivedUrl) {
      return derivedUrl;
    }
  }

  throw new Error(
    "Missing Supabase Edge Function URL. Please set EXPO_PUBLIC_TRPC_URL, EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL, or EXPO_PUBLIC_SUPABASE_PROJECT_ID.",
  );
};

const linkBaseUrl = resolveSupabaseEdgeUrl();

console.log("[tRPC] Using Supabase Edge URL:", linkBaseUrl);

export const getTrpcBaseUrl = () => linkBaseUrl;

const getAuthorizationHeader = async () => {
  try {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-client": "tapse-pos",
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
  httpLink({
    url: linkBaseUrl,
    headers: getAuthorizationHeader,
    fetch(requestUrl, options) {
      const normalizedRequestUrl =
        typeof requestUrl === "string" ? requestUrl : requestUrl.toString();

      const finalOptions: RequestInit = {
        ...(options ?? {}),
        method: "POST",
        keepalive: true,
        credentials: "omit",
      };

      console.log("[tRPC] Fetching:", normalizedRequestUrl);

      return fetch(normalizedRequestUrl, finalOptions).catch((error: any) => {
        const errorMessage = error?.message || String(error);
        console.error("[tRPC fetch error]", {
          url: requestUrl,
          method: "POST",
          body: options?.body,
          error: errorMessage,
          stack: error?.stack,
        });
        throw new Error(
          `tRPC fetch failed: ${errorMessage || "Unknown error"}. Check that your backend is running and EXPO_PUBLIC_TRPC_URL is set correctly.`,
        );
      });
    },
  });

export const trpcClient = createTRPCClient<AppRouter>({
  links: [createTrpcHttpLink()],
});
