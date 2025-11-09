# Rork Kurdish Cuisine Cashier System

This repository contains the production-ready code for the Kurdish Cuisine cashier and dining assistant. The stack is built on Expo SDK 52 with Expo Router, React Native 0.76, and a Supabase-powered data layer exposed through a Hono + tRPC backend. The codebase ships with the Netlify deployment configuration used in production and supports native (iOS/Android), web, and in-restaurant kiosk builds from the same source.

## ✅ What is ready to go
- **Expo SDK 52 / React Native 0.76** configured for both QR-based preview and native builds.
- **Netlify static deploy** exporting the Expo web app to `dist/` with redirects for SPA routing and serverless functions.
- **Backend TypeScript project** under `backend/` compiling to `/backend/dist` and served via Netlify Functions or a dedicated Node process.
- **Supabase integration** with shared environment variables for the frontend and backend plus strict runtime validation.
- **Voice ordering flow** backed by `expo-av`, including permission handling and cross-platform recording support.

## 1. Prerequisites
- Node.js **20.x** and npm **10.x** (EAS CLI also expects Node 18+).
- Expo CLI (`npm install -g expo-cli`) for native preview, or use `npx expo`.
- Access to the Supabase project credentials listed in the provided `env` file.

## 2. Environment variables
Copy the sample environment file to both the Expo and backend contexts. For local development the Expo CLI automatically reads from `.env`.

```bash
cp env .env
cp env backend/.env
```

Ensure the following keys are present:

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL shared by the app and backend |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Public anon key for the Expo client |
| `SUPABASE_URL` | (backend) Server-side Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | (backend) Service-role key for elevated access |
| `EXPO_PUBLIC_API_BASE_URL` / `EXPO_PUBLIC_RORK_API_BASE_URL` | Base URL that Expo clients call for API + tRPC |

## 3. Install dependencies
```bash
npm install
```
This installs all Expo, React Native, Supabase, Hono, and tRPC packages pinned to the versions validated for production. The
local `.npmrc` unlocks the public registry and configures a fallback mirror so `npm install` succeeds even if the primary
registry responds with HTTP 403.

## 4. Local development
### Expo preview (Rork tunnel)
```bash
npm run start
```
- Launches `npx expo start --tunnel`, enabling QR-code preview on physical devices.
- Press `w`, `i`, or `a` in the Metro console to open web, iOS simulator, or Android emulator respectively.

### Full-stack development loop
```bash
npm run dev
```
- Starts the Expo tunnel and runs `npm --prefix backend run start` (Hono + tRPC with live reload).
- Access backend endpoints at `http://localhost:3000/api/*` while the server is running.

## 5. Building and validation
### Backend build
```bash
npm run build:backend
```
- Installs backend dependencies with offline-aware retries and compiles TypeScript output to `backend/dist`.
- Produces server-ready files consumed by Netlify Functions and container builds.

### Web export
```bash
npm run build:web
```
- Generates the static web bundle in `dist/`, clearing any previous artifacts for clean deploys.

### Combined build
```bash
npm run build
```
- Runs the automated stability script which:
  - Validates and auto-heals `package.json` / `app.json` syntax issues before building.
  - Clears npm, Expo, and Metro caches, frees Expo dev-server ports, and validates `.env` + `.env.stable` variables.
  - Installs dependencies (`npm ci` when `package-lock.json` exists, otherwise `npm install`) and executes `npm run build:full`.
  - Writes structured diagnostics to `logs/build_health.json` and commits with a timestamped message when changes are detected.

### Expo health checks
```bash
npm run doctor
```
- Runs `npx expo doctor` to verify the SDK 52 toolchain and catch missing native modules early.

### Scheduled integrity report
```bash
npm run health:check
```
- Produces a 24-hour health snapshot in `logs/auto_health_check.json`, confirming Supabase connectivity, JSON syntax integrity, and port availability. Ideal for cron-based monitoring on production hosts.

### Native prebuild (optional)
```bash
npm run prebuild
```
- Executes `npx expo prebuild --clean`, regenerating the native iOS and Android directories when you need to inspect native code locally.

## 6. Deployment
### Netlify
The repository includes `netlify.toml` and a serverless function wrapper in `netlify/functions/api.js`.
1. Run `npm run build` to produce `dist/` and `backend/dist/`.
2. Deploy the `dist/` folder along with the Netlify functions directory.
3. Environment variables for Netlify can be copied from `.env` / `backend/.env`.

### Alternative hosting
- **Render / Railway / Vercel** can target the compiled backend by running `npm --prefix backend run build` and serving `backend/dist/index.js` on Node 20.
- Expo native builds are compatible with EAS Build using the pinned dependencies in `package.json` and `app.json`.

## 7. Key directories
| Path | Description |
| --- | --- |
| `app/` | Expo Router screens, tabs, and modals |
| `components/` | Shared UI (chatbot, voice order, analytics widgets) |
| `lib/` | Supabase client and local Rork assistant implementation |
| `backend/` | Hono + tRPC backend with Supabase data access |
| `netlify/` | Netlify Functions entry point binding to the compiled backend |
| `public/` | Static assets for web export |

## 8. Feature checkpoints
- Voice orders record via `expo-av` and call the transcription API, showing confirmation modals across platforms.
- The in-app chatbot runs offline using the `useRorkAgent` hook and localized greetings.
- tRPC routes cover menu, orders, tables, employees, inventory, suppliers, customer history, and reports with Supabase queries.
- Health checks: `/api/health`, `/api/test`, and `/api/trpc` endpoints respond once the backend is running.

## 9. Troubleshooting
- **Nested directories** – Ensure commands run from the project root: `rork-kurdish-cuisine-cashier-system/`. If you see a duplicate path such as `.../rork-kurdish-cuisine-cashier-system/rork-kurdish-cuisine-cashier-system`, move back to the first folder level before running installs or Expo CLI commands.

With these steps the project runs cleanly in Rork preview mode and deploys to Netlify or any Node 20 environment backed by Supabase. Enjoy launching the Kurdish Cuisine cashier experience!
