import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { GitHubService } from '../lib/github';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login');
          return;
        }

        if (session?.provider_token && session?.user) {
          // Get GitHub user data and update profile
          try {
            const github = new GitHubService(session.provider_token);
            const githubUser = await github.getUser();
            
            // Update profile with GitHub data
            const { error: updateError } = await supabase
              .from('profiles')
              .upsert({
                id: session.user.id,
                email: session.user.email,
                github_username: githubUser.login,
                github_access_token: session.provider_token,
                avatar_url: githubUser.avatar_url,
              });
            
            if (updateError) {
              console.error('Error updating profile:', updateError);
            }
          } catch (githubError) {
            console.error('Error fetching GitHub data:', githubError);
          }
          
          navigate('/dashboard');
        } else if (session) {
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-300 mt-4">Completing authentication...</p>
      </div>
    </div>
  );
}