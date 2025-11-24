// tRPC client configuration
// Uses EXPO_PUBLIC_TRPC_URL (preferred) to reach the Supabase Edge Function endpoint.
// Expected final URL: https://<project>.supabase.co/functions/v1/tapse-backend
// Centralized here to avoid previous "Failed to fetch" issues caused by mismatched hosts/paths.
import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/types/trpc";

export const trpc = createTRPCReact<AppRouter>();
export const trpcTransformer = superjson;

const DEFAULT_FUNCTION_NAME = "tapse-backend";
const TRPC_SUFFIX = "/trpc";
const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const collapseDoubleSlashes = (value: string) => {
  if (!value) {
    return value;
  }

  const [protocol, ...rest] = value.split("://");
  if (rest.length === 0) {
    return value.replace(/\/{2,}/g, "/");
  }

  const sanitizedPath = rest.join("://").replace(/\/{2,}/g, "/");
  return `${protocol}://${sanitizedPath}`;
};
const removeDuplicateEdgeSegments = (value: string) =>
  value.replace(/\/functions\/v1\/functions(?=\/|$)/g, "/functions/v1");
const sanitizeUrl = (value: string) => collapseDoubleSlashes(removeDuplicateEdgeSegments(value));
const appendPathSegment = (base: string, segment: string) =>
  sanitizeUrl(`${stripTrailingSlash(base)}/${segment.replace(/^\/+/, "")}`);
const ensureTrpcSuffix = (value: string) => {
  const sanitized = stripTrailingSlash(value);
  if (sanitized.endsWith(TRPC_SUFFIX)) {
    return sanitized;
  }

  return `${sanitized}${TRPC_SUFFIX}`;
};
const readEnv = (key: string) => {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }

  if (typeof globalThis !== "undefined") {
    return (globalThis as unknown as Record<string, string | undefined>)[key];
  }

  return undefined;
};

const ensureFunctionPath = (value: string) => {
  let normalized = stripTrailingSlash(value);

  if (!/\/functions\/v1(\/|$)/.test(normalized)) {
    normalized = appendPathSegment(normalized, "functions/v1");
  }

  if (!new RegExp(`/${DEFAULT_FUNCTION_NAME}(?:/|$)`).test(normalized)) {
    normalized = appendPathSegment(normalized, DEFAULT_FUNCTION_NAME);
  }

  return sanitizeUrl(normalized);
};

const buildTrpcEndpoint = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withFunctionPath = ensureFunctionPath(trimmed);
  return sanitizeUrl(ensureTrpcSuffix(withFunctionPath));
};

const resolveSupabaseEdgeUrl = (): string => {
  const explicitUrl = buildTrpcEndpoint(readEnv("EXPO_PUBLIC_TRPC_URL"));
  if (explicitUrl) {
    return explicitUrl;
  }

  const supabaseFunctionsUrl = buildTrpcEndpoint(readEnv("EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL"));
  if (supabaseFunctionsUrl) {
    return supabaseFunctionsUrl;
  }

  const projectRef = readEnv("EXPO_PUBLIC_SUPABASE_PROJECT_ID")?.trim();
  if (projectRef) {
    const derivedUrl = buildTrpcEndpoint(`https://${projectRef}.supabase.co`);
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
    const anonKey = readEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY")?.trim();

    if (!anonKey) {
      throw new Error("Missing EXPO_PUBLIC_SUPABASE_ANON_KEY; cannot authenticate Supabase Edge requests.");
    }

    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-client": "tapse-pos",
      Authorization: `Bearer ${anonKey}`,
    };
  } catch (error) {
    console.error("[tRPC Auth] Failed to resolve authorization header", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
};

const prependBaseUrl = (requestUrl: string) => {
  if (/^https?:\/\//i.test(requestUrl)) {
    return requestUrl;
  }

  if (requestUrl.startsWith("?")) {
    return `${linkBaseUrl}${requestUrl}`;
  }

  return sanitizeUrl(`${linkBaseUrl}/${requestUrl.replace(/^\/+/g, "")}`);
};

export const createTrpcHttpLink = () =>
  httpLink({
    url: linkBaseUrl,
    headers: getAuthorizationHeader,
    fetch(requestUrl, options) {
      const normalizedRequestUrl =
        typeof requestUrl === "string" ? requestUrl : requestUrl.toString();
      const targetUrl = prependBaseUrl(normalizedRequestUrl);

      const finalOptions: RequestInit = {
        ...(options ?? {}),
        method: "POST",
        keepalive: true,
        credentials: "omit",
      };

      console.log("[tRPC] Fetching:", targetUrl);

      return fetch(targetUrl, finalOptions).catch((error: any) => {
        const errorMessage = error?.message || String(error);
        console.error("[tRPC fetch error]", {
          url: targetUrl,
          baseUrl: linkBaseUrl,
          method: "POST",
          body: options?.body,
          error: errorMessage,
          stack: error?.stack,
        });
        throw new Error(
          `tRPC fetch failed: ${errorMessage || "Unknown error"}. Check that your backend is running and EXPO_PUBLIC_TRPC_URL is set correctly (resolved to ${linkBaseUrl}).`,
        );
      });
    },
  });

export const trpcClient = createTRPCClient<AppRouter>({
  links: [createTrpcHttpLink()],
});
