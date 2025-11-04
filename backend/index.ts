import { serve } from "hono/node-server";
import app from "./hono.js";

const port = Number.parseInt(process.env.PORT || "3000", 10);

console.log(`🚀 Starting server on port ${port}...`);

const baseUrl =
  process.env.BACKEND_PUBLIC_URL ||
  process.env.FRONTEND_URL ||
  process.env.EXPO_PUBLIC_RORK_API_BASE_URL ||
  `http://localhost:${port}`;

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server running on: ${baseUrl}`);
console.log(`💚 Health check: ${baseUrl}/api/health`);
console.log(`🧩 Supabase test: ${baseUrl}/api/test`);
console.log(`🔗 tRPC endpoint: ${baseUrl}/api/trpc`);
