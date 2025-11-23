import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { createClient } from "@supabase/supabase-js";

const app = new Hono();

app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.header("Access-Control-Allow-Headers", "*");

  if (c.req.method === "OPTIONS") {
    return c.text("", 204);
  }

  await next();
});

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

app.use("/tapse-backend/trpc/*", async (c, next) => {
  console.log("[Hono] tRPC request received:", c.req.method, c.req.url);
  await next();
});

app.use(
  "/tapse-backend/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) =>
  c.json({
    status: "✅ Rork backend is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  }),
);

app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  }),
);

app.get("/api/test", async (c) => {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .limit(1);
    if (error) {
      return c.json({
        message: "❌ Error connecting to Supabase",
        error: error.message,
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
      error: String(err),
    }, 500);
  }
});

export default app;
export const fetch = app.fetch;
