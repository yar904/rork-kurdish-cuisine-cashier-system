import app from "./hono";

const port = parseInt(process.env.PORT || "3000");

console.log(`✅ Server is running on port ${port}`);

if (process.env.NODE_ENV !== "production") {
  const { serve } = await import("@hono/node-server");
  serve({
    fetch: app.fetch,
    port,
  });
}

export default app;