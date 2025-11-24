import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/types/trpc";

export const trpc = createTRPCReact<AppRouter>();
export const trpcTransformer = superjson;

const resolveTrpcUrl = () => {
  const envUrl = process.env?.EXPO_PUBLIC_TRPC_URL;

  if (!envUrl) {
    throw new Error("EXPO_PUBLIC_TRPC_URL is required for tRPC connectivity.");
  }

  return envUrl.endsWith("/trpc") ? envUrl : `${envUrl}/trpc`;
};

const resolvedTrpcUrl = resolveTrpcUrl();

console.log("[tRPC] Using Supabase Edge URL:", resolvedTrpcUrl);

export const getTrpcBaseUrl = () => resolvedTrpcUrl;

const getAuthorizationHeader = async () => {
  const anonKey = process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!anonKey) {
    throw new Error("Missing EXPO_PUBLIC_SUPABASE_ANON_KEY; cannot authenticate Supabase Edge requests.");
  }

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-client": "tapse-pos",
    Authorization: `Bearer ${anonKey}`,
  };
};

const stringifyError = (value: unknown) => {
  if (value instanceof Error) {
    return value.message;
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

const logTrpcError = (payload: Record<string, unknown>) => {
  console.error("[tRPC fetch error]", JSON.stringify(payload, null, 2));
};

export const createTrpcHttpLink = () =>
  httpLink({
    url: resolvedTrpcUrl,
    headers: getAuthorizationHeader,
    async fetch(requestUrl, options) {
      const targetUrl = typeof requestUrl === "string" ? requestUrl : requestUrl.toString();
      console.log("[tRPC] Fetching:", targetUrl);

      try {
        const response = await fetch(requestUrl, options);

        if (!response.ok) {
          const bodyText = await response.text().catch(() => undefined);
          const errorDetails = {
            url: targetUrl,
            baseUrl: resolvedTrpcUrl,
            status: response.status,
            statusText: response.statusText,
            method: options?.method ?? "POST",
            body: options?.body,
            responseBody: bodyText,
          };
          logTrpcError(errorDetails);
          throw new Error(
            `tRPC fetch failed (${response.status} ${response.statusText}). Ensure EXPO_PUBLIC_TRPC_URL (${resolvedTrpcUrl}) and EXPO_PUBLIC_SUPABASE_ANON_KEY are set correctly.`,
          );
        }

        return response;
      } catch (error: unknown) {
        const errorMessage = stringifyError(error);
        logTrpcError({
          url: targetUrl,
          baseUrl: resolvedTrpcUrl,
          method: options?.method ?? "POST",
          body: options?.body,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw new Error(
          `tRPC fetch failed: ${errorMessage}. Ensure EXPO_PUBLIC_TRPC_URL (${resolvedTrpcUrl}) and EXPO_PUBLIC_SUPABASE_ANON_KEY are set correctly.`,
        );
      }
    },
  });

export const trpcClient = createTRPCClient<AppRouter>({
  links: [createTrpcHttpLink()],
});
