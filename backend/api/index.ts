import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "../trpc/app-router.js";
import { createContext } from "../trpc/create-context.js";

export const config = { runtime: "edge" } as const;

const app = new Hono().basePath("/api");

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:8081",
  "exp://127.0.0.1:8081",
];

const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const uniqueOrigins = Array.from(
  new Set([
    ...configuredOrigins,
    process.env.FRONTEND_URL,
    process.env.EXPO_PUBLIC_APP_URL,
    ...defaultOrigins,
  ].filter(Boolean) as string[])
);

app.use(
  "*",
  cors({
    origin: uniqueOrigins,
    credentials: true,
  })
);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

app.get("/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  })
);

app.get("/", (c) =>
  c.text("✅ Kurdish Cuisine API running on Vercel Edge Runtime")
);

export const GET = handle(app);
export const POST = handle(app);
