import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/types/trpc";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const API_URL =
  "https://opspnzswjxzvywqjqvjy.supabase.co/functions/v1/tapse-backend";

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${API_URL}/trpc`,
      transformer: superjson,
    }),
  ],
});
