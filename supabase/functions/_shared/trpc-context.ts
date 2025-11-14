import { FetchCreateContextFnOptions } from "npm:@trpc/server@10.45.0/adapters/fetch";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  console.log("[Supabase Edge] Creating context with URL:", supabaseUrl?.substring(0, 30) + "...");

  const supabase = createClient(
    supabaseUrl!,
    supabaseServiceKey!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return {
    req: opts.req,
    supabase,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
