import { useState } from 'react';
import { Github, Database, Key, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'completed' | 'error';
  instructions: string[];
  links?: { text: string; url: string }[];
}

export function SetupGuide() {
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'github',
      title: 'GitHub OAuth App',
      description: 'Create a GitHub OAuth application for authentication',
      icon: <Github className="h-6 w-6" />,
      status: 'pending',
      instructions: [
        'Go to GitHub Settings > Developer settings > OAuth Apps',
        'Click "New OAuth App"',
        'Set Application name: "Vibe Coding Platform"',
        'Set Homepage URL: http://localhost:5173',
        'Set Authorization callback URL: https://vsbvc.netlify.app/functions/github-callback',
        'Copy the Client ID to your .env file as VITE_GITHUB_CLIENT_ID',
        'Copy the Client Secret (you\'ll need this for Supabase GitHub OAuth setup)',
        'IMPORTANT: Also configure GitHub OAuth in Supabase (see Supabase setup instructions)'
      ],
      links: [
        { text: 'GitHub OAuth Apps', url: 'https://github.com/settings/applications/new' }
      ]
    },
    {
      id: 'supabase',
      title: 'Supabase Database',
      description: 'Set up Supabase for user management and data storage',
      icon: <Database className="h-6 w-6" />,
      status: 'pending',
      instructions: [
        'Go to your Supabase project dashboard',
        'Navigate to Settings > API',
        'Copy the "Project URL" (should look like: https://gwzvlrqabxlswuaryfad.supabase.co)',
        'Copy the "anon public" key from the Project API keys section',
        'Set VITE_SUPABASE_URL to the Project URL',
        'Set VITE_SUPABASE_ANON_KEY to the anon public key',
        '',
        'CRITICAL: Enable GitHub OAuth Provider:',
        '1. In Supabase Dashboard, go to Authentication > Providers',
        '2. Find "GitHub" and click to configure it',
        '3. Enable the GitHub provider',
        '4. Enter your GitHub OAuth App Client ID',
        '5. Enter your GitHub OAuth App Client Secret',
        '6. Set Redirect URL to: https://gwzvlrqabxlswuaryfad.supabase.co/auth/v1/callback',
        '7. Save the configuration'
      ],
      links: [
        { text: 'Supabase Dashboard', url: 'https://supabase.com/dashboard' },
        { text: 'Supabase Auth Providers', url: 'https://supabase.com/dashboard/project/gwzvlrqabxlswuaryfad/auth/providers' }
      ]
    },
    {
      id: 'api-keys',
      title: 'OpenRouter AI API',
      description: 'Add your OpenRouter API key for AI-powered code generation',
      icon: <Key className="h-6 w-6" />,
      status: 'pending',
      instructions: [
        'Sign up for an account at OpenRouter.ai',
        'Generate an API key from your OpenRouter dashboard',
        'Add it to your .env file as VITE_OPENROUTER_API_KEY',
        'The base URL is already configured for OpenRouter'
      ],
      links: [
        { text: 'OpenRouter Dashboard', url: 'https://openrouter.ai/keys' },
        { text: 'OpenRouter Documentation', url: 'https://openrouter.ai/docs' }
      ]
    }
  ]);

  const checkEnvVariable = (varName: string) => {
    const value = import.meta.env[varName];
    if (!value || value === 'undefined') return false;
    
    // Check against common placeholder patterns
    const placeholders = [
      'your_' + varName.toLowerCase().replace('vite_', '') + '_here',
      'your_github_client_id_here',
      'your_supabase_url_here',
      'your_supabase_anon_key_here',
      'your_openrouter_api_key_here'
    ];
    
    // Additional check for URL validity if it's a URL variable
    if (varName.includes('URL') && value) {
      return !placeholders.includes(value) && value.startsWith('http');
    }
    
    return !placeholders.includes(value);
  };

  const updateStepStatus = (stepId: string, status: 'pending' | 'completed' | 'error') => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  // Check environment variables
  const githubConfigured = checkEnvVariable('VITE_GITHUB_CLIENT_ID');
  const supabaseConfigured = checkEnvVariable('VITE_SUPABASE_URL') && checkEnvVariable('VITE_SUPABASE_ANON_KEY');
  const apiKeysConfigured = checkEnvVariable('VITE_OPENROUTER_API_KEY');

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Vibe Platform Setup</h1>
          <p className="text-gray-400 text-lg">
            Let's get your coding platform ready for testing
          </p>
        </div>

        {/* Environment Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Environment Status</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${githubConfigured ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`}>
              <div className="flex items-center space-x-2">
                {githubConfigured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-white font-medium">GitHub OAuth</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {githubConfigured ? 'Configured' : 'Not configured'}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${supabaseConfigured ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`}>
              <div className="flex items-center space-x-2">
                {supabaseConfigured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-white font-medium">Supabase</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {supabaseConfigured ? 'Configured' : 'Not configured'}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${apiKeysConfigured ? 'border-green-500 bg-green-500/10' : 'border-yellow-500 bg-yellow-500/10'}`}>
              <div className="flex items-center space-x-2">
                {apiKeysConfigured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <span className="text-white font-medium">OpenRouter AI</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {apiKeysConfigured ? 'Configured' : 'Optional for now'}
              </p>
            </div>
          </div>
        </div>

        {/* Setup Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.id} className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    step.id === 'github' && githubConfigured ? 'bg-green-500/20 text-green-500' :
                    step.id === 'supabase' && supabaseConfigured ? 'bg-green-500/20 text-green-500' :
                    step.id === 'api-keys' && apiKeysConfigured ? 'bg-green-500/20 text-green-500' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {step.icon}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {index + 1}. {step.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {step.id === 'github' && githubConfigured && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {step.id === 'supabase' && supabaseConfigured && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {step.id === 'api-keys' && apiKeysConfigured && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-400 mb-4">{step.description}</p>
                  
                  <div className="space-y-2">
                    {step.instructions.map((instruction, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <span className="text-blue-400 text-sm mt-1">{idx + 1}.</span>
                        <span className="text-gray-300 text-sm">{instruction}</span>
                      </div>
                    ))}
                  </div>
                  
                  {step.links && step.links.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {step.links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                        >
                          <span>{link.text}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Test Button */}
        {githubConfigured && supabaseConfigured && (
          <div className="mt-8 text-center">
            <a
              href="/login"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test GitHub OAuth Flow →
            </a>
          </div>
        )}

        {/* Current Environment Variables */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Current Environment Variables</h3>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">VITE_GITHUB_CLIENT_ID:</span>
              <span className={githubConfigured ? 'text-green-400' : 'text-red-400'}>
                {githubConfigured ? '✓ Set' : '✗ Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">VITE_SUPABASE_URL:</span>
              <span className={checkEnvVariable('VITE_SUPABASE_URL') ? 'text-green-400' : 'text-red-400'}>
                {checkEnvVariable('VITE_SUPABASE_URL') ? '✓ Set' : '✗ Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">VITE_SUPABASE_ANON_KEY:</span>
              <span className={checkEnvVariable('VITE_SUPABASE_ANON_KEY') ? 'text-green-400' : 'text-red-400'}>
                {checkEnvVariable('VITE_SUPABASE_ANON_KEY') ? '✓ Set' : '✗ Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">VITE_OPENROUTER_API_KEY:</span>
              <span className={checkEnvVariable('VITE_OPENROUTER_API_KEY') ? 'text-green-400' : 'text-yellow-400'}>
                {checkEnvVariable('VITE_OPENROUTER_API_KEY') ? '✓ Set' : '○ Optional'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}