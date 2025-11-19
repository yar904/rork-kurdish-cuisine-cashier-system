import { supabase } from "./supabase.ts";

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export interface TRPCContext {
  supabase: typeof supabase;
  user: AuthenticatedUser | null;
  request: Request;
}

export async function createTRPCContext(request: Request): Promise<TRPCContext> {
  const authHeader = request.headers.get("Authorization");
  let user: AuthenticatedUser | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    const { data, error } = await supabase.auth.getUser(token);

    if (!error && data.user) {
      user = {
        id: data.user.id,
        email: data.user.email ?? undefined,
      };
    }
  }

  return {
    supabase,
    user,
    request,
  };
}
