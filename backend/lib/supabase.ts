import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('[Supabase Client] Initializing...');
console.log('[Supabase Client] URL:', supabaseUrl ? '✅ Defined' : '❌ Undefined');
console.log('[Supabase Client] Key:', supabaseKey ? '✅ Defined' : '❌ Undefined');

if (!supabaseUrl || !supabaseKey) {
  const errorMsg = `Missing Supabase environment variables:
  - SUPABASE_PROJECT_URL: ${supabaseUrl ? 'Defined' : 'MISSING'}
  - SUPABASE_ANON_KEY: ${supabaseKey ? 'Defined' : 'MISSING'}
Please add these to Netlify environment variables.`;
  console.error('[Supabase Client]', errorMsg);
  throw new Error(errorMsg);
}

console.log('[Supabase Client] Creating client with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

console.log('[Supabase Client] ✅ Client created successfully');
