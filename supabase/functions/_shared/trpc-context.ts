// Placeholder – Rork will fill logic in Prompt 2
export async function createContext(opts: any) {
  return { req: opts.req, supabase: null };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
