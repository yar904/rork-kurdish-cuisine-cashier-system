import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/types/trpc";
import superjson from "superjson";

const normalizeUrl = (value?: string | null) =>
  value?.replace(/\/+$/, "") ?? undefined;

const buildEndpoint = (baseUrl: string) => `${baseUrl}/tapse-backend`;

export const getTrpcBaseUrl = (): string => {
  const envBaseUrl = normalizeUrl(process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
  if (envBaseUrl) {
    return buildEndpoint(envBaseUrl);
  }

  const supabaseFunctionsUrl = normalizeUrl(
    process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL,
  );
  if (supabaseFunctionsUrl) {
    return buildEndpoint(supabaseFunctionsUrl);
  }

  // Local Supabase CLI default functions URL
  return "http://localhost:54321/functions/v1/tapse-backend";
};

export const trpc = createTRPCReact<AppRouter>();
export const trpcTransformer = superjson;

export const createTrpcHttpLink = (url = getTrpcBaseUrl()) =>
  httpBatchLink({
    url,
    headers: () => ({
      "Content-Type": "application/json",
    }),
    fetch(requestUrl, options) {
      return fetch(requestUrl, {
        ...options,
        credentials: "omit",
      });
    },
  });

export const trpcClient = createTRPCClient<AppRouter>({
  transformer: trpcTransformer,
  links: [createTrpcHttpLink()],
});