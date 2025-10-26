import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { createClient } from "@supabase/supabase-js";

const app = new Hono();

app.use("*", cors({
  origin: (origin) => {
    const allowedOrigins = [
      "https://kurdish-cuisine-cashier-system.rork.app",
      "http://localhost:8081",
      "http://localhost:3000",
    ];
    if (!origin || 
        origin.startsWith("exp://") || 
        origin.endsWith(".rork.app") || 
        origin.endsWith(".netlify.app") ||
        origin.endsWith(".onrender.com") ||
        origin.endsWith(".railway.app") ||
        origin.endsWith(".vercel.app") ||
        allowedOrigins.includes(origin)) {
      return origin || "*";
    }
    return null;
  },
  credentials: true,
}));

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_ANON_KEY!
);

app.use(
  "/api/trpc/*",
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

export default app;