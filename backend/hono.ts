import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "../trpc/app-router";
import { createContext } from "../trpc/create-context";
import "dotenv/config";

const app = new Hono();

// ✅ Allow both Netlify + Localhost
app.use(
  "*",
  cors({
    origin: [
      "https://tapse.netlify.app",
      "http://localhost:8081",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

// ✅ tRPC API Routes
app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

// ✅ Health Check
app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  })
);

// ✅ Supabase Test Route
app.get("/api/test", (c) =>
  c.json({
    message: "Supabase connected successfully!",
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  })
);

export default app;