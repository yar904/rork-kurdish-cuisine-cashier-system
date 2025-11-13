import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
    console.log('[TRPC] Using API base URL:', url);
    return url;
  }

  if (typeof window !== 'undefined') {
    console.log('[TRPC] Using localhost (web)');
    return 'http://localhost:3000';
  }

  console.log('[TRPC] Using localhost (server)');
  return 'http://localhost:3000';
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      fetch: (url, options) => {
        console.log('[TRPC] Making request to:', url);
        return fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            'Content-Type': 'application/json',
          },
        }).then(res => {
          console.log('[TRPC] Response status:', res.status);
          if (!res.ok) {
            console.error('[TRPC] Request failed:', res.status, res.statusText);
          }
          return res;
        }).catch(err => {
          console.error('[TRPC] Network error:', err);
          throw err;
        });
      },
    }),
  ],
});
