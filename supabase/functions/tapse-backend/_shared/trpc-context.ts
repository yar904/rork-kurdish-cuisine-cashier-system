import { supabase } from "./supabase.ts";

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export interface TRPCContext {
  supabase: typeof supabase;
  user?: AuthenticatedUser | null;
  request?: Request;
}

export async function createTRPCContext(_req: Request): Promise<TRPCContext> {
  return { supabase };
}
