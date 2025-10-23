// backend/hono.ts
import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

// Enable CORS for all routes
app.use("*", cors());

// Mount tRPC API routes
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

// Simple health check route
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;

/**
 * ============================================================
 * === RORK + VERCEL DEPLOYMENT CONFIGURATION (REFERENCE) ===
 * ============================================================
 * These exports are used only for build metadata within Rork.
 * When deployed to Vercel, your backend will use this setup.
 * If you export later or move to manual deployment, create
 * actual files using this configuration.
 */

// === backend/package.json (auto reference) ===
export const backendPackageJson = `
{
  "name": "restaurant-backend",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc && node dist/index.js",
    "start": "node dist/index.js",
    "dev": "tsx backend/hono.ts"
  },
  "dependencies": {
    "@hono/node-server": "^1.13.7",
    "@hono/trpc-server": "^0.4.0",
    "@supabase/supabase-js": "^2.75.1",
    "@trpc/server": "^11.6.0",
    "hono": "^4.10.1",
    "superjson": "^2.2.2",
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "tsx": "^4.19.2",
    "typescript": "^5.8.3"
  }
}
`;

// === backend/tsconfig.json (auto reference) ===
export const backendTsConfig = `
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
`;