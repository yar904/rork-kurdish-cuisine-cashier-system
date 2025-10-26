import { serve } from "@hono/node-server";
import app from "./hono";

const port = parseInt(process.env.PORT || "3000");

console.log(`🚀 Starting server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server is running on http://localhost:${port}`);
console.log(`📍 Health check: http://localhost:${port}/api/health`);
console.log(`📍 Supabase test: http://localhost:${port}/api/test`);
console.log(`📍 tRPC endpoint: http://localhost:${port}/api/trpc`);
