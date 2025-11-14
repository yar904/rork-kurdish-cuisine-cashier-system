const { Hono } = require('hono');
const { handle } = require('hono/netlify');
const { cors } = require('hono/cors');
const { trpcServer } = require('@hono/trpc-server');
const { appRouter } = require('../../backend/trpc/app-router');
const { createContext } = require('../../backend/trpc/create-context');

const app = new Hono();

app.use('*', cors({
  origin: (origin) => {
    const allowedOrigins = [
      'https://kurdish-cuisine-cashier-system.rork.app',
      'https://tapse.netlify.app',
      'http://localhost:8081',
      'http://localhost:3000',
    ];
    if (!origin || 
        origin.startsWith('exp://') || 
        origin.endsWith('.rork.app') || 
        origin.endsWith('.netlify.app') ||
        origin.endsWith('.supabase.co') ||
        allowedOrigins.includes(origin)) {
      return origin || '*';
    }
    return null;
  },
  credentials: true,
}));

app.use('/trpc/*', trpcServer({
  router: appRouter,
  createContext,
}));

app.get('/', (c) => c.json({ 
  status: '✅ Backend is running on Netlify', 
  version: '1.0.0',
  timestamp: new Date().toISOString()
}));

app.get('/api/health', (c) => c.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
}));

exports.handler = handle(app);