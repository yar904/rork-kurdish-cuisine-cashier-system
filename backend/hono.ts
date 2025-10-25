import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

// Enable CORS for local + production
app.use(
  "/*",
  cors({
    origin: [
      "http://localhost:8081",
      "exp://", // for Expo mobile preview
      "https://kurdish-cuisine-cashier-system.rork.app",
    ],
  })
);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Root check
app.get("/", (c) => c.text("Backend is running ✅"));

// Health check
app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  })
);

// Supabase connection test
app.get("/api/test", async (c) => {
  try {
    const { data, error } = await supabase.from("restaurants").select("*").limit(1);
    if (error) throw error;
    return c.json({
      message: "🔥 Rork backend is live and connected to Supabase!",
      supabaseConnected: true,
      sample: data,
    });
  } catch (err: any) {
    return c.json({
      message: "❌ Error connecting to Supabase",
      supabaseConnected: false,
      error: err.message,
    });
  }
});

// Mount tRPC server
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

export default app;