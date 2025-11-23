import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { createClient } from "@supabase/supabase-js";

const app = new Hono();

// ---------- CORS ----------
app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header("Access-Control-Allow-Headers", "*");

  if (c.req.method === "OPTIONS") {
    return c.text("", 204);
  }

  await next();
});

// ---------- Supabase Server Client ----------
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!,
);

// ---------- Logging ----------
app.use("/tapse-backend/trpc/*", async (c, next) => {
  console.log("[TRPC] Request:", c.req.method, c.req.url);
  await next();
});

// ---------- TRPC Server ----------
app.use(
  "/tapse-backend/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  }),
);

// ---------- Health ----------
app.get("/tapse-backend/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  }),
);

// ---------- Root ----------
app.get("/", (c) =>
  c.json({
    status: "Backend running",
    time: new Date().toISOString(),
  }),
);

export default app;
export const fetch = app.fetch;
