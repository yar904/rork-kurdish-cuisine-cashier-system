import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
    console.log('[tRPC] Using configured API base URL:', baseUrl);
    return baseUrl;
  }

  if (typeof window !== 'undefined') {
    console.log('[tRPC] Using localhost URL for web');
    return 'http://localhost:3000/api';
  }

  console.log('[tRPC] Using localhost URL');
  return 'http://localhost:3000/api';
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/trpc`,
      transformer: superjson,
      fetch: (url, options) => {
        console.log('[tRPC] Request URL:', url);
        console.log('[tRPC] Request options:', JSON.stringify(options, null, 2));
        return fetch(url, options)
          .then(response => {
            console.log('[tRPC] Response status:', response.status);
            if (!response.ok) {
              console.error('[tRPC] Response not OK:', response.status, response.statusText);
            }
            return response;
          })
          .catch((err) => {
            console.error('[tRPC] Network error:', err.message);
            console.error('[tRPC] Full error:', err);
            throw new Error(`Failed to connect to backend: ${err.message}`);
          });
      },
    }),
  ],
});
