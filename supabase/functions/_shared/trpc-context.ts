import type { FetchCreateContextFnOptions } from "npm:@trpc/server@10.45.0/adapters/fetch";
import { getSupabaseClient } from "./supabase.ts";

export async function createContext({ req }: FetchCreateContextFnOptions) {
  const supabase = getSupabaseClient();

  return {
    req,
    supabase,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
