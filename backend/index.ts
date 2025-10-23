import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";

const app = new Hono();

// Enable CORS
app.use("*", cors());

// Connect to Supabase
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

app.get("/", (c) => c.text("✅ Kurdish Cuisine Cashier System Backend is running!"));

app.get("/test-db", async (c) => {
  try {
    const { data, error } = await supabase.from("users").select("*").limit(1);
    if (error) throw error;
    return c.json({ success: true, data });
  } catch (err: any) {
    return c.json({ success: false, message: err.message });
  }
});

const port = parseInt(process.env.PORT || "3000");
console.log(`🚀 Server running on port ${port}`);

if (process.env.NODE_ENV !== "production") {
  serve({ fetch: app.fetch, port });
}

export default app;