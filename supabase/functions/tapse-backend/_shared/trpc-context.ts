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

const getBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");

  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return null;
  }

  return token;
};

export async function createTRPCContext(req: Request): Promise<TRPCContext> {
  console.log("[tRPC Context] Creating context for request:", req.method, req.url);
  
  const token = getBearerToken(req);
  let user: AuthenticatedUser | null = null;

  if (token) {
    console.log("[tRPC Context] Token found, attempting to authenticate");
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.warn("[tRPC Context] Auth error (non-blocking):", error.message);
    } else if (data.user) {
      user = { id: data.user.id, email: data.user.email };
      console.log("[tRPC Context] User authenticated:", user.id);
    }
  } else {
    console.log("[tRPC Context] No token provided, proceeding as anonymous");
  }

  return {
    supabase,
    user,
    request: req,
  };
}
