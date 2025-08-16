import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  github_username: string;
  github_access_token: string;
  avatar_url: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionCheckInterval, setSessionCheckInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if user is logged in
    checkUser();

    // Set up periodic session validation (every 2 minutes)
    const interval = setInterval(() => {
      validateSession();
    }, 2 * 60 * 1000); // 2 minutes

    setSessionCheckInterval(interval);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          checkUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('🔄 Session token refreshed successfully');
          checkUser();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, []);

  const validateSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('⚠️ Session validation error:', error);
        return;
      }

      if (!session) {
        console.log('❌ No active session found');
        setUser(null);
        return;
      }

      // Check if token is close to expiry (within 5 minutes)
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt ? expiresAt - now : 0;

      if (timeUntilExpiry < 300) { // Less than 5 minutes
        console.log('🔄 Token expiring soon, refreshing...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('❌ Failed to refresh session:', refreshError);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('❌ Session validation failed:', error);
    }
  };
  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Validate GitHub token is still valid
        if (session.provider_token) {
          try {
            const response = await fetch('https://api.github.com/user', {
              headers: {
                'Authorization': `token ${session.provider_token}`,
              },
            });
            
            if (!response.ok) {
              console.warn('⚠️ GitHub token may be invalid');
              // Don't sign out immediately, but log the issue
            }
          } catch (error) {
            console.warn('⚠️ Could not validate GitHub token:', error);
          }
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUser(profile);
        } else {
          console.warn('⚠️ No profile found for user');
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGitHub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'repo user:email',
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signInWithGitHub,
    signOut,
  };
}