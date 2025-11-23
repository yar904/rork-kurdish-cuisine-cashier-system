import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

const allowOrigin = (origin?: string) => {
  if (!origin) return "*";
  if (origin === "https://tapse.netlify.app") return origin;
  if (/^https?:\/\/localhost:\d+/.test(origin)) return origin;
  if (/^https:\/\/.*\.rork\.app$/.test(origin)) return origin;
  if (origin.startsWith("exp://")) return "*";
  return "*";
};

app.use("*", async (c, next) => {
  const origin = allowOrigin(c.req.header("origin") ?? c.req.header("Origin"));

  c.header("Access-Control-Allow-Origin", origin);
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, apikey, x-client-info, x-trpc-source, x-supabase-api-version"
  );
  c.header("Access-Control-Allow-Credentials", "true");
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
    supabaseUrl:
      process.env.SUPABASE_PROJECT_URL ||
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      null,
    timestamp: new Date().toISOString(),
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
