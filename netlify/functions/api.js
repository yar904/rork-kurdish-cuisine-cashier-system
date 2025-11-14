const { handle } = require('@hono/node-server/netlify');

// Import the Hono app from backend
// The TypeScript files will be transpiled by esbuild during Netlify build
const app = require('../../backend/hono.ts').default;

// Export the Netlify handler that wraps the Hono app
exports.handler = handle(app);
