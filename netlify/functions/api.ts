import { handle } from '@hono/node-server/netlify';
import app from '../../backend/hono';

export const handler = handle(app);
