import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";
import type { FetchCreateContextFnOptions } from "npm:@trpc/server@10.45.0/adapters/fetch";

export async function createContext({ req }: FetchCreateContextFnOptions) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    req,
    supabase,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
