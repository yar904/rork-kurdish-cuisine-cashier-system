import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { createClient } from "@supabase/supabase-js";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import "dotenv/config";

const app = new Hono();

app.use("*", cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) => 
  c.json({ 
    status: "✅ Backend is running", 
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development"
  })
);

app.get("/api/health", (c) => 
  c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  })
);

app.get("/api/test", async (c) => {
  try {
    const { error } = await supabase
      .from("menu_items")
      .select("count")
      .limit(1);
    
    if (error) {
      return c.json({ 
        status: "error", 
        message: "Supabase connection failed",
        error: error.message 
      }, 500);
    }
    
    return c.text("🔥 Rork backend is live and connected to Supabase!");
  } catch (err) {
    return c.json({ 
      status: "error", 
      message: "Backend test failed",
      error: String(err) 
    }, 500);
  }
});

const port = Number(process.env.PORT) || 3000;
console.log(`🚀 Rork backend running on http://localhost:${port}`);
console.log(`🔗 Supabase URL: ${process.env.SUPABASE_PROJECT_URL}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

serve({ fetch: app.fetch, port });
