import { TRPCError } from "@trpc/server";
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

const getBearerToken = (req: Request): string => {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");

  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid authorization header" });
  }

  return token;
};

export async function createTRPCContext(req: Request): Promise<TRPCContext> {
  const token = getBearerToken(req);
  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: error.message });
  }

  return {
    supabase,
    user: data.user ? { id: data.user.id, email: data.user.email } : null,
    request: req,
  };
}
