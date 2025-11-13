import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "../../backend/trpc/app-router";
import { createContext } from "../../backend/trpc/create-context";

const app = new Hono();

app.use("*", cors({
  origin: (origin) => {
    const allowedOrigins = [
      "https://kurdish-cuisine-cashier-system.rork.app",
      "https://tapse.netlify.app",
      "http://localhost:8081",
      "http://localhost:3000",
    ];
    if (!origin || 
        origin.startsWith("exp://") || 
        origin.endsWith(".rork.app") || 
        origin.endsWith(".netlify.app") ||
        origin.endsWith(".supabase.co") ||
        allowedOrigins.includes(origin)) {
      return origin || "*";
    }
    return null;
  },
  credentials: true,
}));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) => c.json({ 
  status: "✅ Rork backend is running", 
  version: "1.0.0",
  timestamp: new Date().toISOString()
}));

app.get("/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  })
);

export default async (req, context) => {
  return await app.fetch(req, {
    ...context,
    waitUntil: context.waitUntil?.bind(context),
  });
};