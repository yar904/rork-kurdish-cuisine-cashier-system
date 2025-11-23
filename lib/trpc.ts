import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/types/trpc";
import superjson from "superjson";
import { supabase } from "./supabase";

export const getTrpcBaseUrl = (): string => {
  const apiUrl = process.env.EXPO_PUBLIC_TRPC_URL;
  if (apiUrl) return apiUrl;

  return "https://qspznswjzxyvvqjqvjvj.supabase.co/functions/v1/tapse-backend/trpc";
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
