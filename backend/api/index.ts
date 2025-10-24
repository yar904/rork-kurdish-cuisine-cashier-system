import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import { appRouter } from '../trpc/app-router';
import { createContext } from '../trpc/create-context';

export const config = {
  runtime: 'edge',
};

const app = new Hono().basePath('/api');

// Enable CORS
app.use('*', cors({
  origin: ['http://localhost:3000', process.env.FRONTEND_URL || '*'],
  credentials: true,
}));

// TRPC router (optional)
app.use('/trpc/*', appRouter, createContext);

// Health route
app.get('/health', (c) =>
  c.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// Root route
app.get('/', (c) =>
  c.text('✅ Kurdish Cuisine API running on Vercel Edge Runtime')
);

// Export for Vercel runtime
export const GET = handle(app);
export const POST = handle(app);