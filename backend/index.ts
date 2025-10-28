import { serve } from "hono/node-server";
import app from "./hono";

const port = parseInt(process.env.PORT || "3000");

console.log(`🚀 Starting server on port ${port}...`);

// Prefer deployed URLs for logging
const baseUrl =
  process.env.EXPO_PUBLIC_RORK_API_BASE_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  process.env.FRONTEND_URL ||
  "https://endearing-kheer-8f2632.netlify.app";

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server running on: ${baseUrl}`);
console.log(`💚 Health check: ${baseUrl}/api/health`);
console.log(`🧩 Supabase test: ${baseUrl}/api/test`);
console.log(`🔗 tRPC endpoint: ${baseUrl}/api/trpc`);