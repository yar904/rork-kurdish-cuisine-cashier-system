import type { inferAsyncReturnType } from "jsr:@trpc/server@^10.45.0";
import { supabase } from "./supabase.ts";

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
}

export interface TRPCContext {
  supabase: typeof supabase;
  user: AuthenticatedUser | null;
  request: Request;
}

export async function createTRPCContext(req: Request): Promise<TRPCContext> {
  console.log("[tRPC Context] Creating context for request:", req.method, req.url);

  let user: AuthenticatedUser | null = null;

  return {
    supabase,
    user,
    request: req,
  };
}

export type CreateTRPCContext = inferAsyncReturnType<typeof createTRPCContext>;
