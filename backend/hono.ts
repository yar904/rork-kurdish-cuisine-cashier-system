import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const app = new Hono();

app.use("*", cors({
  origin: [
    "https://kurdish-cuisine-cashier-system.rork.app",
    "http://localhost:8081",
    "exp://"
  ],
  credentials: true,
}));

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_ANON_KEY!
);

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

app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  })
);

app.get("/api/test", async (c) => {
  try {
    const { data, error } = await supabase.from("restaurants").select("*").limit(1);
    if (error) {
      return c.json({ 
        message: "❌ Error connecting to Supabase", 
        error: error.message 
      }, 500);
    }
    return c.json({
      message: "🔥 Rork backend is live and connected to Supabase!",
      supabaseConnected: true,
      sample: data,
    });
  } catch (err) {
    return c.json({ 
      message: "❌ Unexpected error", 
      error: String(err) 
    }, 500);
  }
});

const port = Number(process.env.PORT) || 3000;
console.log(`🔥 Rork backend running on http://localhost:${port}`);
console.log(`📡 Health check: http://localhost:${port}/api/health`);
console.log(`🧪 Test endpoint: http://localhost:${port}/api/test`);
console.log(`🔌 tRPC endpoint: http://localhost:${port}/trpc`);

serve({ fetch: app.fetch, port });