import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/types/trpc";

export const trpc = createTRPCReact<AppRouter>();
export const trpcTransformer = superjson;

const readEnv = (key: string) => {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }

  if (typeof globalThis !== "undefined") {
    const globalRecord = globalThis as Record<string, unknown>;
    const value = globalRecord[key];
    return typeof value === "string" ? value : undefined;
  }

  return undefined;
};

const resolveTrpcUrl = () => {
  const envUrl = readEnv("EXPO_PUBLIC_TRPC_URL");

  if (!envUrl) {
    throw new Error("EXPO_PUBLIC_TRPC_URL is required for tRPC connectivity.");
  }

  return envUrl.endsWith("/trpc") ? envUrl : `${envUrl}/trpc`;
};

const resolvedTrpcUrl = resolveTrpcUrl();

console.log("[tRPC] Using Supabase Edge URL:", resolvedTrpcUrl);

export const getTrpcBaseUrl = () => resolvedTrpcUrl;

const getAuthorizationHeader = async () => {
  const anonKey = readEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY");

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

export const createTrpcHttpLink = () =>
  httpLink({
    url: resolvedTrpcUrl,
    headers: getAuthorizationHeader,
    fetch(requestUrl, options) {
      const targetUrl = typeof requestUrl === "string" ? requestUrl : requestUrl.toString();
      console.log("[tRPC] Fetching:", targetUrl);

      return fetch(requestUrl, options).catch((error: any) => {
        const errorMessage = error?.message || String(error);
        console.error("[tRPC fetch error]", {
          url: targetUrl,
          baseUrl: resolvedTrpcUrl,
          method: options?.method ?? "POST",
          body: options?.body,
          error: errorMessage,
          stack: error?.stack,
        });
        throw new Error(
          `tRPC fetch failed: ${errorMessage || "Unknown error"}. Ensure EXPO_PUBLIC_TRPC_URL (${resolvedTrpcUrl}) and EXPO_PUBLIC_SUPABASE_ANON_KEY are set correctly.`,
        );
      });
    },
  });

export const trpcClient = createTRPCClient<AppRouter>({
  links: [createTrpcHttpLink()],
});
