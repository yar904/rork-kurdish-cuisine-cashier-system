import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
    console.log('[TRPC] Using API base URL:', url);
    return url;
  }

  if (typeof window !== 'undefined') {
    console.log('[TRPC] Using localhost (web)');
    return 'http://localhost:3000';
  }

  console.log('[TRPC] Using localhost (server)');
  return 'http://localhost:3000';
};

const getTRPCUrl = () => {
  const baseUrl = getBaseUrl();
  
  if (baseUrl.includes('netlify.app')) {
    const url = `${baseUrl}/.netlify/functions/api/trpc`;
    console.log('[TRPC] Final tRPC URL (Netlify):', url);
    return url;
  }
  
  if (baseUrl.includes('/.netlify/functions')) {
    const url = `${baseUrl}/trpc`;
    console.log('[TRPC] Final tRPC URL (Netlify functions):', url);
    return url;
  }
  
  const url = `${baseUrl}/api/trpc`;
  console.log('[TRPC] Final tRPC URL (normal):', url);
  return url;
};

let isBackendHealthy = true;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000;

const checkBackendHealth = async () => {
  const now = Date.now();
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return isBackendHealthy;
  }
  
  try {
    const baseUrl = getBaseUrl();
    const healthUrl = baseUrl.includes('netlify.app') 
      ? `${baseUrl}/.netlify/functions/api/health`
      : `${baseUrl}/api/health`;
    
    console.log('[TRPC] Checking backend health:', healthUrl);
    const response = await fetch(healthUrl, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    isBackendHealthy = response.ok;
    lastHealthCheck = now;
    
    console.log('[TRPC] Backend health check:', isBackendHealthy ? '✅ Healthy' : '❌ Unhealthy');
    return isBackendHealthy;
  } catch (error) {
    console.error('[TRPC] Health check failed:', error);
    isBackendHealthy = false;
    lastHealthCheck = now;
    return false;
  }
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: getTRPCUrl(),
      transformer: superjson,
      fetch: async (url, options) => {
        console.log('[TRPC] Making request to:', url);
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
              ...options?.headers,
              'Content-Type': 'application/json',
            },
          });
          
          clearTimeout(timeoutId);
          
          console.log('[TRPC] Response status:', response.status);
          
          if (!response.ok) {
            console.error('[TRPC] Request failed:', response.status, response.statusText);
            
            if (response.status === 503 || response.status === 502 || response.status === 504) {
              isBackendHealthy = false;
              console.error('[TRPC] ⚠️ Backend is unavailable. Please check Netlify deployment.');
              
              const error = new Error('Backend service is temporarily unavailable. The server may be starting up or experiencing issues.');
              (error as any).status = response.status;
              throw error;
            }
            
            if (response.status === 404) {
              console.error('[TRPC] ⚠️ Endpoint not found. The API route may not be deployed.');
              const error = new Error('API endpoint not found. Please ensure the backend is properly deployed.');
              (error as any).status = response.status;
              throw error;
            }
          }
          
          return response;
        } catch (err: any) {
          console.error('[TRPC] Network error:', err.message || err);
          
          if (err.name === 'AbortError') {
            console.error('[TRPC] Request timed out after 10 seconds');
            throw new Error('Request timed out. The backend may be slow or unavailable.');
          }
          
          if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
            console.error('[TRPC] ⚠️ Cannot connect to backend. Check your internet connection and backend deployment.');
            throw new Error('Cannot connect to server. Please check your internet connection.');
          }
          
          throw err;
        }
      },
    }),
  ],
});
