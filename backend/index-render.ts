import { Hono } from "hono";
import { serve } from "hono/node-server";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "../trpc/app-router";
import { createContext } from "../trpc/create-context";
import "dotenv/config";

const app = new Hono();

// Allow both Netlify + local dev
app.use(
  "*",
  cors({
    origin: [
      "https://endearing-kheer-8f2632.netlify.app",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

// API
app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

serve({
  fetch: app.fetch,
  port: parseInt(process.env.PORT || "3000"),
});

console.log("✅ Render backend is running");