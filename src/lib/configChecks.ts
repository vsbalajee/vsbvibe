// Configuration validation utilities
// Separated from supabase.ts to avoid bundling conflicts

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Export the configuration check function
export const isSupabaseConfigured = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  return supabaseUrl && 
         supabaseAnonKey && 
         isValidUrl(supabaseUrl) &&
         !supabaseUrl.includes('your_supabase_url_here') &&
         !supabaseAnonKey.includes('your_supabase_anon_key_here');
};