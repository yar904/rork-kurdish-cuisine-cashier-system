import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const app = new Hono();
app.use("/*", cors());

// ✅ Initialize Supabase Client
const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// ✅ Root route
app.get("/", (c) => c.text("Backend is running ✅"));

// ✅ Health check
app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  })
);

// ✅ Supabase connection test
app.get("/api/test", async (c) => {
  const { data, error } = await supabase.from("restaurants").select("*").limit(1);
  if (error) {
    return c.json({ message: "❌ Error connecting to Supabase", error: error.message });
  }
  return c.json({
    message: "🔥 Rork backend is live and connected to Supabase!",
    sample: data,
  });
});

// ✅ Server
const port = Number(process.env.PORT) || 3000;
console.log(`🔥 Rork backend running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });