import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const allowList = [
  "https://tapse.netlify.app",
  "http://localhost:3000",
  "https://oqspnszwjxzyvwqjvjiy.supabase.co",
  "https://oqspnszwjxzyvwqjvjiy.functions.supabase.co",
];

const isAllowedOrigin = (origin?: string | null) => {
  if (!origin) return false;
  if (allowList.includes(origin)) return true;
  if (origin.startsWith("exp://")) return true;
  if (/^https?:\/\/localhost:\d+$/.test(origin)) return true;
  if (/^https:\/\/.*\.rork\.app$/.test(origin)) return true;
  return false;
};

const resolveOrigin = (origin?: string | null) => {
  if (isAllowedOrigin(origin)) return origin as string;
  return allowList[0];
};

const app = new Hono();

app.use("*", async (c, next) => {
  const origin = resolveOrigin(c.req.header("Origin"));

  c.header("Access-Control-Allow-Origin", origin);
  c.header("Vary", "Origin");
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header(
    "Access-Control-Allow-Headers",
    "authorization, content-type, x-trpc-source, x-client-info, apikey, x-supabase-api-version",
  );
  c.header("Access-Control-Max-Age", "86400");

  if (c.req.method === "OPTIONS") {
    return c.body(null, 204);
  }

  return next();
});

app.use("/tapse-backend/trpc/*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    return c.body(null, 204);
  }

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
    ok: true,
    environment: process.env.NODE_ENV,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  }),
);

export default app;
export const fetch = app.fetch;
