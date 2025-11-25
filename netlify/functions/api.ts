import { Handler, HandlerEvent } from '@netlify/functions';

const TRPC_TARGET =
  process.env.EXPO_PUBLIC_TRPC_URL ||
  'https://oqspnszwjxzyvwqjvjiy.functions.supabase.co/tapse-backend/trpc';

const allowedOrigins = [
  'https://tapse.netlify.app',
  'http://localhost:3000',
  'https://oqspnszwjxzyvwqjvjiy.supabase.co',
  'https://oqspnszwjxzyvwqjvjiy.functions.supabase.co',
];

const resolveOrigin = (origin?: string) => {
  if (!origin) return allowedOrigins[0];
  if (origin.startsWith('exp://')) return origin;
  if (/^https?:\/\/localhost:\d+$/.test(origin)) return origin;
  if (/^https:\/\/.*\.rork\.app$/.test(origin)) return origin;
  if (allowedOrigins.includes(origin)) return origin;
  return allowedOrigins[0];
};

export const handler: Handler = async (event: HandlerEvent) => {
  const origin = resolveOrigin(event.headers.origin || event.headers.Origin);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
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
        'Access-Control-Allow-Origin': origin,
      },
      body: JSON.stringify({
        ok: true,
        trpc: TRPC_TARGET,
        timestamp: new Date().toISOString(),
      }),
    };
  }

  if (event.path === '/.netlify/functions/api/health') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
      body: JSON.stringify({
        ok: true,
        environment: process.env.NODE_ENV || 'production',
        trpc: TRPC_TARGET,
      }),
    };
  }

  const trpcPath = event.path.replace('/.netlify/functions/api', '');
  if (!trpcPath.startsWith('/trpc')) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
      body: JSON.stringify({ error: 'Not found' }),
    };
  }

  const targetUrl = `${TRPC_TARGET}${trpcPath.replace(/^\/trpc/, '')}`;

  try {
    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: event.headers as Record<string, string>,
      body: event.body || undefined,
    });

    const body = await response.text();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
      body,
    };
  } catch (error) {
    console.error('[Netlify proxy] Error forwarding to Supabase function', error);
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
      body: JSON.stringify({
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
