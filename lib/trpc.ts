import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/types/trpc";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const API_URL =
  "https://opspnzswjxzvywqjqvjy.functions.supabase.co/tapse-backend";

export const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpLink({
      url: API_URL,
    }),
  ],
});