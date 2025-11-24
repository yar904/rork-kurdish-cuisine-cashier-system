import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/types/trpc";

export const trpc = createTRPCReact<AppRouter>();
export const trpcTransformer = superjson;

const normalizeSupabaseFunctionsUrl = (rawUrl: string) => {
  try {
    const parsed = new URL(rawUrl);
    const hostnameParts = parsed.hostname.split(".");
    const projectId = hostnameParts[0];
    const isRestFunctionsPath = parsed.pathname.startsWith("/functions/v1/");

    if (!projectId || !isRestFunctionsPath) {
      return rawUrl;
    }

    const sanitizedPath = parsed.pathname.replace("/functions/v1", "");
    const rebuiltUrl = `https://${projectId}.functions.supabase.co${sanitizedPath}`;

    if (rawUrl !== rebuiltUrl) {
      console.warn("[tRPC] Normalized Supabase Functions URL", { rawUrl, rebuiltUrl });
    }

    return rebuiltUrl;
  } catch (error) {
    console.warn("[tRPC] Failed to normalize URL", rawUrl, error);
    return rawUrl;
  }
};

const resolveTrpcUrl = () => {
  const envUrl = process.env?.EXPO_PUBLIC_TRPC_URL;

  if (!envUrl) {
    throw new Error("EXPO_PUBLIC_TRPC_URL is required for tRPC connectivity.");
  }

  const normalizedUrl = normalizeSupabaseFunctionsUrl(envUrl);
  return normalizedUrl.endsWith("/trpc") ? normalizedUrl : `${normalizedUrl}/trpc`;
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
    apikey: anonKey,
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

const parseOfflineMessage = (status: number, bodyText?: string) => {
  if (status !== 503 || !bodyText) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(bodyText);
    if (typeof parsed === "object" && parsed && "error" in parsed) {
      const errorValue = (parsed as Record<string, unknown>).error;
      if (errorValue === "offline") {
        return typeof parsed.message === "string"
          ? parsed.message
          : "You appear to be offline. Check your connection and try again.";
      }
    }
  } catch {
    if (bodyText.toLowerCase().includes("offline")) {
      return "You appear to be offline. Check your connection and try again.";
    }
  }

  return undefined;
};

const MAX_TRPC_RETRIES = 2;
const RETRY_DELAY_MS = 600;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetry = (status: number) => status === 429 || status >= 500;

export const createTrpcHttpLink = () =>
  httpLink({
    url: resolvedTrpcUrl,
    headers: getAuthorizationHeader,
    async fetch(requestUrl, options) {
      const targetUrl = typeof requestUrl === "string" ? requestUrl : requestUrl.toString();
      const buildFetchOptions = (): RequestInit => ({
        ...(options ?? {}),
        method: "POST",
        cache: "no-store",
      });

      const attemptFetch = async (attempt: number): Promise<Response> => {
        console.log(`[tRPC] Fetching attempt ${attempt}:`, targetUrl);
        const fetchOptions = buildFetchOptions();

        try {
          const response = await fetch(targetUrl, fetchOptions);

          if (!response.ok) {
            const bodyText = await response.text().catch(() => undefined);
            const offlineMessage = parseOfflineMessage(response.status, bodyText);
            const errorDetails = {
              url: targetUrl,
              baseUrl: resolvedTrpcUrl,
              status: response.status,
              statusText: response.statusText,
              method: fetchOptions.method ?? "POST",
              body: fetchOptions.body,
              responseBody: bodyText,
              attempt,
            };
            logTrpcError(errorDetails);

            if (offlineMessage) {
              throw new Error(offlineMessage);
            }

            if (attempt <= MAX_TRPC_RETRIES && shouldRetry(response.status)) {
              await delay(RETRY_DELAY_MS * attempt);
              return attemptFetch(attempt + 1);
            }

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
            method: fetchOptions.method ?? "POST",
            body: fetchOptions.body,
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
            attempt,
          });

          if (attempt <= MAX_TRPC_RETRIES) {
            await delay(RETRY_DELAY_MS * attempt);
            return attemptFetch(attempt + 1);
          }

          throw new Error(
            `tRPC fetch failed: ${errorMessage}. Ensure EXPO_PUBLIC_TRPC_URL (${resolvedTrpcUrl}) and EXPO_PUBLIC_SUPABASE_ANON_KEY are set correctly.`,
          );
        }
      };

      return attemptFetch(1);
    },
  });

export const trpcClient = createTRPCClient<AppRouter>({
  links: [createTrpcHttpLink()],
});
