import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors());

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;
/**
 * --- RORK VERCEL DEPLOYMENT CONFIGURATION ---
 * This section ensures that when deployed to Vercel,
 * Rork builds with the correct backend setup.
 * You can copy this JSON into local files if you export later.
 */

// === backend/package.json ===
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
`

// === backend/tsconfig.json ===
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
`