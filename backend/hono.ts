import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header("Access-Control-Allow-Headers", "*");
  c.header("Access-Control-Max-Age", "86400");

  if (c.req.method === "OPTIONS") {
    return c.body(null, 204);
  }

  return next();
});

app.use("*", async (c, next) => {
  console.log(`[edge] ${c.req.method} ${c.req.path}`);
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
    environment: process.env.NODE_ENV,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  }),
);

app.get("/api/health", (c) =>
  c.json({
    status: "ok",
  }),
);

app.get("/api/test", (c) => c.text("ok"));

export default app;
export const fetch = app.fetch;
