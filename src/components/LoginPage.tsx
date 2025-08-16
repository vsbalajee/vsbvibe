import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Github, Code, Zap, GitBranch } from 'lucide-react';

export function LoginPage() {
  const { signInWithGitHub } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGitHub();
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <Code className="h-16 w-16 text-blue-400 mr-4" />
            <h1 className="text-6xl font-bold text-white">Vibe</h1>
          </div>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            The intelligent coding platform powered by AI. Build, deploy, and manage your projects with unprecedented speed and precision.
          </p>
          
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            ) : (
              <Github className="h-5 w-5 mr-3" />
            )}
            Continue with GitHub
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 text-center">
            <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">AI-Powered Development</h3>
            <p className="text-gray-300">
              Generate complete applications from natural language prompts using advanced AI models via OpenRouter.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 text-center">
            <GitBranch className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Direct Git Integration</h3>
            <p className="text-gray-300">
              Seamlessly work with your GitHub repositories. Make commits, create branches, and deploy directly from the platform.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 text-center">
            <Code className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Live Preview</h3>
            <p className="text-gray-300">
              See your changes instantly with integrated WebContainer technology. No setup required.
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-4">Powered by cutting-edge technology</p>
          <div className="flex items-center justify-center space-x-8 text-gray-500">
            <span>React</span>
            <span>TypeScript</span>
            <span>WebContainer</span>
            <span>Supabase</span>
            <span>OpenRouter AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}