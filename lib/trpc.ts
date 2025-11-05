import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  if (typeof window !== 'undefined' && window.location.hostname.includes('rork.app')) {
    return `${window.location.protocol}//${window.location.hostname}`;
  }

  if (typeof window !== 'undefined') {
    return 'http://localhost:3000';
  }

  return 'http://localhost:3000';
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers: () => {
        return {
          'Content-Type': 'application/json',
        };
      },
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
        }).then(async (response) => {
          if (!response.ok) {
            const text = await response.text();
            console.error('tRPC HTTP Error:', response.status, text);
            throw new Error(`HTTP Error ${response.status}: ${text}`);
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('tRPC Response is not JSON:', text);
            throw new Error('Response is not JSON');
          }
          
          return response;
        });
      },
    }),
  ],
});
