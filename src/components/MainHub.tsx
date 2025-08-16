import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Code, 
  Edit3, 
  TestTube, 
  FileText, 
  MessageSquare, 
  LogOut,
  Rocket,
  GitBranch,
  Zap,
  BookOpen,
  ArrowRight,
  Lightbulb,
  Users,
  Star
} from 'lucide-react';

export function MainHub() {
  const { user, signOut } = useAuth();

  const actions = [
    {
      id: 'create',
      title: 'Create Project',
      description: 'Generate a new project from templates with AI assistance',
      icon: <Code className="h-8 w-8" />,
      link: '/create-project',
      color: 'from-blue-600 to-purple-600',
      hoverColor: 'from-blue-700 to-purple-700',
      features: ['AI-powered generation', 'Multiple templates', 'GitHub integration']
    },
    {
      id: 'edit',
      title: 'Edit Project',
      description: 'Open existing GitHub repositories with full AI assistance for code generation, enhancement, and development',
      icon: <Edit3 className="h-8 w-8" />,
      link: '/select-repository/edit',
      color: 'from-green-600 to-teal-600',
      hoverColor: 'from-green-700 to-teal-700',
      features: ['AI-powered code generation', 'Intelligent code assistance', 'Advanced file management', 'Real-time GitHub sync']
    },
    {
      id: 'test',
      title: 'Test Project',
      description: 'Analyze code quality and performance of your projects',
      icon: <TestTube className="h-8 w-8" />,
      link: '/select-repository/test',
      color: 'from-purple-600 to-pink-600',
      hoverColor: 'from-purple-700 to-pink-700',
      features: ['Code review', 'Performance analysis', 'Best practices']
    },
    {
      id: 'document',
      title: 'Document Project',
      description: 'Generate comprehensive documentation for your codebase',
      icon: <FileText className="h-8 w-8" />,
      link: '/select-repository/docs',
      color: 'from-orange-600 to-red-600',
      hoverColor: 'from-orange-700 to-red-700',
      features: ['Auto-generated docs', 'API documentation', 'README creation']
    },
    {
      id: 'discuss',
      title: 'Discuss Project',
      description: 'Chat with AI about architecture, best practices, and solutions',
      icon: <MessageSquare className="h-8 w-8" />,
      link: '/select-repository/discuss',
      color: 'from-indigo-600 to-blue-600',
      hoverColor: 'from-indigo-700 to-blue-700',
      features: ['AI consultation', 'Architecture advice', 'Problem solving']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Rocket className="h-8 w-8 text-blue-400" />
                <h1 className="text-2xl font-bold text-white">Vibe</h1>
              </div>
              <span className="text-gray-400">|</span>
              <span className="text-gray-300">AI-Powered Development Platform</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <img
                src={user?.avatar_url}
                alt={user?.github_username}
                className="h-8 w-8 rounded-full"
              />
              <span className="text-gray-300">{user?.github_username}</span>
              <button
                onClick={signOut}
                className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            Welcome to Your Development Hub
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Choose your next action to accelerate your development workflow with AI-powered tools and intelligent assistance.
          </p>
          
          {/* Quick Stats */}
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <GitBranch className="h-4 w-4 text-green-400" />
              <span>GitHub Integration</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span>Developer Focused</span>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {actions.map((action, index) => (
            <Link
              key={action.id}
              to={action.link}
              className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`}></div>
              
              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${action.color} rounded-xl mb-6 text-white shadow-lg`}>
                  {action.icon}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                  {action.title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 mb-6 leading-relaxed">
                  {action.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {action.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-2 text-sm text-gray-500">
                      <Star className="h-3 w-3 text-blue-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium bg-gradient-to-r ${action.color} bg-clip-text text-transparent`}>
                    Get Started
                  </span>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-3">Getting Started Guide</h3>
                <div className="grid md:grid-cols-2 gap-6 text-gray-400">
                  <div>
                    <h4 className="font-medium text-gray-300 mb-2">New to Vibe?</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Start with "Create Project" to generate your first AI-powered application</li>
                      <li>• Choose from various templates like e-commerce, blogs, or dashboards</li>
                      <li>• All projects are automatically synced to your GitHub account</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-300 mb-2">Working with Existing Projects?</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Use "Edit Project" to modify code with AI assistance</li>
                      <li>• "Test Project" provides code quality analysis and performance insights</li>
                      <li>• "Document Project" generates comprehensive documentation automatically</li>
                      <li>• "Discuss Project" offers AI consultation on architecture and best practices</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Documentation</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Support</span>
            </div>
            <div className="flex items-center space-x-2">
              <GitBranch className="h-4 w-4" />
              <span>GitHub</span>
            </div>
          </div>
          <p className="text-gray-600 mt-4">
            Powered by AI • Built for Developers • Integrated with GitHub
          </p>
        </div>
      </div>
    </div>
  );
}