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

const TRPC_ENDPOINT_PATH = "/tapse-backend/trpc";
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

const buildTrpcUrlCandidates = () => {
  const explicitUrl = ensureTrpcEndpoint(process.env.EXPO_PUBLIC_TRPC_URL);
  const supabaseFunctionsUrl = ensureTrpcEndpoint(process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL);
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const derivedFunctionsUrl = supabaseUrl
    ? ensureTrpcEndpoint(`${stripTrailingSlash(supabaseUrl)}/functions/v1`)
    : null;

  const unorderedCandidates = [explicitUrl, supabaseFunctionsUrl, derivedFunctionsUrl];
  const uniqueCandidates: string[] = [];

  unorderedCandidates.forEach((candidate) => {
    if (candidate && !uniqueCandidates.includes(candidate)) {
      uniqueCandidates.push(candidate);
    }
  });

  return uniqueCandidates;
};

const trpcUrlCandidates = buildTrpcUrlCandidates();

if (!trpcUrlCandidates.length) {
  console.error("[tRPC] Missing EXPO_PUBLIC_TRPC_URL or fallback Supabase function URLs");
  throw new Error(
    "Missing EXPO_PUBLIC_TRPC_URL, EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL, or EXPO_PUBLIC_SUPABASE_URL. Please check your .env file.",
  );
}

let activeUrlIndex = 0;
let cachedTrpcUrl: string | null = trpcUrlCandidates[activeUrlIndex];
const linkBaseUrl = trpcUrlCandidates[0];

console.log("[tRPC] Endpoint candidates:", trpcUrlCandidates);

// ---------- FINAL TRPC URL – ALWAYS USE THIS ----------
export const getTrpcBaseUrl = () => {
  if (cachedTrpcUrl) {
    return cachedTrpcUrl;
  }

  cachedTrpcUrl = trpcUrlCandidates[activeUrlIndex];
  console.log("[tRPC] Using resolved URL:", cachedTrpcUrl);
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
    url: linkBaseUrl,
    headers: getAuthorizationHeader,
    fetch(requestUrl, options) {
      const normalizedRequestUrl =
        typeof requestUrl === "string" ? requestUrl : requestUrl.toString();
      const requestSuffix = normalizedRequestUrl.startsWith(linkBaseUrl)
        ? normalizedRequestUrl.slice(linkBaseUrl.length)
        : "";

      const tryFetch = async (baseUrl: string) => {
        const finalUrl = requestSuffix ? `${baseUrl}${requestSuffix}` : normalizedRequestUrl;
        console.log("[tRPC] Fetching:", finalUrl);
        return fetch(finalUrl, {
          ...options,
          credentials: "omit" as const,
        });
      };

      const runWithFallbacks = async () => {
        let lastError: unknown = null;

        for (let candidateIndex = activeUrlIndex; candidateIndex < trpcUrlCandidates.length; candidateIndex += 1) {
          const candidate = trpcUrlCandidates[candidateIndex];

          try {
            const response = await tryFetch(candidate);

            if (activeUrlIndex !== candidateIndex) {
              console.warn(`[tRPC] Switched endpoint to ${candidate}`);
            }

            activeUrlIndex = candidateIndex;
            cachedTrpcUrl = candidate;
            return response;
          } catch (error) {
            lastError = error;
            console.warn(`[tRPC] Request failed for ${candidate}:`, error);
          }
        }

        throw lastError ?? new Error("Unknown network error");
      };

      return runWithFallbacks().catch((error: any) => {
        const errorMessage = error?.message || String(error);
        console.error("[tRPC fetch error]", {
          url: requestUrl,
          method: options?.method ?? "POST",
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
