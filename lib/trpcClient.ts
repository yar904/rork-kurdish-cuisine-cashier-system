import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/supabase/functions/tapse-backend/router';

const TRPC_ENDPOINT = 'https://opsqnzswjxzvywqjvjy.functions.supabase.co/tapse-backend';

export const trpc = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: TRPC_ENDPOINT,
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {})
          }
        })
    })
  ]
});
