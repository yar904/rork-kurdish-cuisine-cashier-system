import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'
import { trpcServer } from '@hono/trpc-server'
import { appRouter } from '../trpc/app-router'
import { createContext } from '../trpc/create-context'

export const config = { runtime: 'edge' }

const app = new Hono().basePath('/api')

app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8081',
    process.env.FRONTEND_URL || '*'
  ],
  credentials: true,
}))

app.use('/trpc/*', trpcServer({
  router: appRouter,
  createContext,
}))

app.get('/health', (c) => c.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
}))

app.get('/', (c) => c.text('✅ Kurdish Cuisine API running on Vercel Edge Runtime'))

export const GET = handle(app)
export const POST = handle(app)
