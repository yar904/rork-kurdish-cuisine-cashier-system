import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

// Global CORS for Supabase Edge Function usage
app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, apikey, x-client-info, x-trpc-source, x-supabase-api-version",
  );

  if (c.req.method === "OPTIONS") {
    return c.body(null, 204);
  }

  return next();
});

// Log all tRPC traffic for debugging
app.use("/tapse-backend/trpc/*", async (c, next) => {
  console.log(`[Hono] tRPC request received: ${c.req.method} ${c.req.url}`);
  return next();
});

// tRPC server mount
app.use(
  "/tapse-backend/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  }),
);

// Health checks
app.get("/tapse-backend/health", (c) =>
  c.json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    supabaseUrl:
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      process.env.SUPABASE_PROJECT_URL ||
      null,
    timestamp: new Date().toISOString(),
  }),
);

app.get("/tapse-backend/trpc/health", (c) =>
  c.json({
    status: "ok",
    trpc: "/tapse-backend/trpc",
    timestamp: new Date().toISOString(),
  }),
);

export default app;
export const fetch = app.fetch;
