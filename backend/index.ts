<<<<<<< HEAD
import { serve } from "hono/node-server";
=======
import { serve } from "@hono/node-server";
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
import app from "./hono";

const port = parseInt(process.env.PORT || "3000");

console.log(`🚀 Starting server on port ${port}...`);

<<<<<<< HEAD
// Prefer deployed URLs for logging
const baseUrl =
  process.env.EXPO_PUBLIC_RORK_API_BASE_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  process.env.FRONTEND_URL ||
  "https://endearing-kheer-8f2632.netlify.app";

=======
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
serve({
  fetch: app.fetch,
  port,
});

<<<<<<< HEAD
console.log(`✅ Server running on: ${baseUrl}`);
console.log(`💚 Health check: ${baseUrl}/api/health`);
console.log(`🧩 Supabase test: ${baseUrl}/api/test`);
console.log(`🔗 tRPC endpoint: ${baseUrl}/api/trpc`);
=======
console.log(`✅ Server is running on http://localhost:${port}`);
console.log(`📍 Health check: http://localhost:${port}/api/health`);
console.log(`📍 Supabase test: http://localhost:${port}/api/test`);
console.log(`📍 tRPC endpoint: http://localhost:${port}/api/trpc`);
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
