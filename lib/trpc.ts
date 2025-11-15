import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/types/trpc";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const API_URL =
  "https://opsnzswjxzvywvqjvjvy.functions.supabase.co/tapse-backend";

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      headers: {
        "Content-Type": "application/json",
      },
    }),
  ],
});