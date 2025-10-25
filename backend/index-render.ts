import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import "dotenv/config";

const app = new Hono();

app.use("*", cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8081',
    'https://rork-kurdish-cuisine-cashier-system.vercel.app',
    process.env.FRONTEND_URL || '*'
  ],
  credentials: true,
}));

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

app.get("/api/health", (c) => c.json({
  status: "ok",
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || "development"
}));

app.get("/api", (c) => c.json({ 
  status: "✅ Kurdish Cuisine Cashier System API", 
  version: "1.0.0",
  deployed: "Render"
}));

app.get("/", (c) => c.json({ 
  status: "✅ Kurdish Cuisine Cashier System API", 
  version: "1.0.0",
  deployed: "Render",
  healthCheck: "/api/health"
}));

const port = Number(process.env.PORT) || 3000;

serve({ 
  fetch: app.fetch, 
  port 
});

console.log(`🟢 Backend running on port ${port}`);
console.log(`🔗 Health check: http://localhost:${port}/api/health`);
