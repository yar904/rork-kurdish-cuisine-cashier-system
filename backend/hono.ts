import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowed = [
        "https://tapse.netlify.app",
        "https://kurdish-cuisine-cashier-system.rork.app",
        "https://oqspnszwjxzyvwqjvjiy.supabase.co",
        "http://localhost:3000",
        "http://localhost:8081"
      ];
      if (!origin) return "*";
      return allowed.includes(origin) ? origin : "https://tapse.netlify.app";
    },
    credentials: true,
  })
);

app.get("/", (c) => c.json({ status: "✅ Backend running", timestamp: Date.now() }));

export default app;