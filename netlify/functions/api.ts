import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../backend/trpc/app-router';
import { createContext } from '../../backend/trpc/create-context';

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  console.log('[Netlify Function] Request:', event.httpMethod, event.path);
  console.log('[Netlify Function] Headers:', event.headers);
  console.log('[Netlify Function] Body:', event.body);

  const allowedOrigins = [
    'https://kurdish-cuisine-cashier-system.rork.app',
    'https://tapse.netlify.app',
    'http://localhost:8081',
    'http://localhost:3000',
  ];

  const origin = event.headers.origin || event.headers.Origin || '';
  const isAllowedOrigin = 
    !origin ||
    origin.startsWith('exp://') ||
    origin.endsWith('.rork.app') ||
    origin.endsWith('.netlify.app') ||
    origin.endsWith('.supabase.co') ||
    allowedOrigins.includes(origin);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? (origin || '*') : 'null',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: '',
    };
  }

  if (event.path === '/.netlify/functions/api' || event.path === '/.netlify/functions/api/') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': isAllowedOrigin ? (origin || '*') : 'null',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: JSON.stringify({
        status: '✅ Rork backend is running (Netlify)',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      }),
    };
  }

  if (event.path === '/.netlify/functions/api/health') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': isAllowedOrigin ? (origin || '*') : 'null',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
      }),
    };
  }

  const url = new URL(event.rawUrl || `https://tapse.netlify.app${event.path}`);
  const request = new Request(url, {
    method: event.httpMethod,
    headers: new Headers(event.headers as Record<string, string>),
    body: event.body || undefined,
  });

  console.log('[Netlify Function] Forwarding to tRPC handler');

  try {
    const response = await fetchRequestHandler({
      endpoint: '/.netlify/functions/api/trpc',
      req: request,
      router: appRouter,
      createContext: () => createContext({ req: request, resHeaders: new Headers() }),
    });

    const responseBody = await response.text();
    console.log('[Netlify Function] tRPC response status:', response.status);
    console.log('[Netlify Function] tRPC response body:', responseBody);

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': isAllowedOrigin ? (origin || '*') : 'null',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: responseBody,
    };
  } catch (error) {
    console.error('[Netlify Function] Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': isAllowedOrigin ? (origin || '*') : 'null',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};

export { handler };
