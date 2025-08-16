import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './configChecks';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Create a mock client if Supabase is not configured
const createSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured properly. Using mock client.');
    // Return a mock client that won't break the app
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithOAuth: () => Promise.resolve({ error: new Error('Supabase not configured') }),
        signOut: () => Promise.resolve({ error: null }),
        refreshSession: () => Promise.resolve({ error: new Error('Supabase not configured') })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
          })
        })
      })
    } as any;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Auto refresh tokens 5 minutes before expiry
      autoRefreshToken: true,
      // Persist session in localStorage
      persistSession: true,
      // Detect session in URL on redirect
      detectSessionInUrl: true,
      // Refresh token threshold (5 minutes before expiry)
      refreshTokenThreshold: 300
    }
  });
};

export const supabase = createSupabaseClient();

// Re-export the configuration check for convenience
export { isSupabaseConfigured };