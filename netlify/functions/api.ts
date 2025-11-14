import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "../../backend/trpc/app-router";
import { createContext } from "../../backend/trpc/create-context";
import { handle } from '@hono/node-server/netlify';

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

app.use("*", async (c, next) => {
  console.log('[Netlify Function] Request:', c.req.method, c.req.url, c.req.path);
  await next();
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) => c.json({ 
  status: "✅ Rork backend is running (Netlify)", 
  version: "1.0.0",
  timestamp: new Date().toISOString()
}));

app.get("/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production",
  })
);

export const handler = handle(app);
