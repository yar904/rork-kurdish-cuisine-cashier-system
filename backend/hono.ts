import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const allowedOrigins = [
  "https://tapse.netlify.app",
  "https://expo.dev",
  "http://localhost:3000",
  "http://localhost:8081",
];

const isAllowedOrigin = (origin?: string | null) => {
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.startsWith("expo://")) return true;
  if (/^https:\/\/.*\.rork\.app$/.test(origin)) return true;
  return false;
};

const resolveOrigin = (origin?: string | null) => {
  if (isAllowedOrigin(origin)) return origin as string;
  return "*";
};

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => resolveOrigin(origin),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["*"],
  }),
);

app.use("*", async (c, next) => {
  const origin = resolveOrigin(c.req.header("Origin"));
  c.header("Access-Control-Allow-Origin", origin);
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header("Access-Control-Allow-Headers", "*");

  if (c.req.method === "OPTIONS") {
    return c.text("", 200);
  }

  await next();
});

app.use(
  "/tapse-backend/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  }),
);

app.get("/tapse-backend/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() }),
);

app.get("/", (c) => c.text("Tapse backend is running"));

export default app;
export const fetch = app.fetch;
