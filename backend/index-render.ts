import { Hono } from "hono";
import { serve } from "hono/node-server";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router.js";
import { createContext } from "./trpc/create-context.js";
import "dotenv/config";

const app = new Hono();

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:8081",
  "exp://127.0.0.1:8081",
];

const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  "*",
  cors({
    origin: [...configuredOrigins, ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []), ...defaultOrigins],
    credentials: true,
  })
);

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

serve({
  fetch: app.fetch,
  port: Number.parseInt(process.env.PORT || "3000", 10),
});

console.log("✅ Render backend is running");