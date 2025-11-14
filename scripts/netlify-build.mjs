#!/usr/bin/env node

import { build } from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildNetlifyFunction() {
  console.log('Building Netlify function with path alias support...');
  
  const aliasPlugin = {
    name: 'alias',
    setup(build) {
      build.onResolve({ filter: /^@\/backend\// }, args => {
        const importPath = args.path.replace(/^@\/backend\//, '');
        const resolvedPath = path.resolve(__dirname, '../backend', importPath);
        
        if (fs.existsSync(resolvedPath + '.ts')) {
          return { path: resolvedPath + '.ts' };
        }
        if (fs.existsSync(resolvedPath + '.js')) {
          return { path: resolvedPath + '.js' };
        }
        if (fs.existsSync(resolvedPath)) {
          return { path: resolvedPath };
        }
        
        return null;
      });
    },
  };

  try {
    await build({
      entryPoints: ['netlify/functions/api.ts'],
      bundle: true,
      outfile: 'netlify/functions/api.js',
      platform: 'node',
      target: 'node20',
      format: 'cjs',
      external: [
        '@supabase/supabase-js',
        '@hono/node-server',
        'hono',
      ],
      plugins: [aliasPlugin],
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      loader: {
        '.ts': 'ts',
      },
    });

    console.log('✅ Netlify function built successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildNetlifyFunction();
