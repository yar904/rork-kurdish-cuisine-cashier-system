import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, apikey, x-client-info, x-trpc-source, x-supabase-api-version",
  );
  c.header("Access-Control-Allow-Credentials", "true");

  if (c.req.method === "OPTIONS") {
    return c.body(null, 204);
  }

  return next();
});

app.use("/tapse-backend/trpc/*", async (c, next) => {
  console.log(`[Hono] tRPC request received: ${c.req.method} ${c.req.url}`);
  return next();
});

app.use(
  "/tapse-backend/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  }),
);

app.get("/tapse-backend/health", (c) =>
  c.json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    supabaseUrl:
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
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

app.get("/api/health", (c) =>
  c.json({
    status: "ok",
  }),
);

export default app;
export const fetch = app.fetch;
