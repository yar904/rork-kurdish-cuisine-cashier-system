import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/types/trpc";
import superjson from "superjson";
import { supabase } from "./supabase";

const normalizeUrl = (value?: string | null) =>
  value?.replace(/\/+$/, "") ?? undefined;

const buildEndpoint = (baseUrl: string, path = "/api/trpc") =>
  `${baseUrl}${path}`;

export const getTrpcBaseUrl = (): string => {
  const envBaseUrl = normalizeUrl(process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
  if (envBaseUrl) {
    return buildEndpoint(envBaseUrl);
  }

  const supabaseFunctionsUrl = normalizeUrl(
    process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL,
  );
  if (supabaseFunctionsUrl) {
    return buildEndpoint(supabaseFunctionsUrl, "/tapse-backend");
  }

  // Local backend default URL
  return "http://localhost:3000/api/trpc";
};

export const trpc = createTRPCReact<AppRouter>();
export const trpcTransformer = superjson;

const getAuthorizationHeader = async () => {
  const { data } = await supabase.auth.getSession();
  const token =
    data.session?.access_token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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