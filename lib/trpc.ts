import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { supabase } from "./supabase";
import type { AppRouter } from "@/types/trpc";

export const trpc = createTRPCReact<AppRouter>();
export const trpcTransformer = superjson;

// ---------- FINAL TRPC URL – ALWAYS USE THIS ----------
export const getTrpcBaseUrl = () =>
  "https://oqspnszwjxzyvwqjvjiy.functions.supabase.co/tapse-backend/trpc";

const getAuthorizationHeader = async () => {
  const session = await supabase.auth.getSession();
  const token =
    session.data.session?.access_token ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
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
