import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GitHubService } from '../lib/github';
import { 
  Search, 
  Star, 
  GitFork, 
  Calendar, 
  ExternalLink, 
  ArrowLeft,
  Code,
  Edit3,
  TestTube,
  FileText,
  MessageSquare,
  Folder,
  Clock,
  ChevronRight
} from 'lucide-react';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  language: string;
  default_branch: string;
}

export function RepositorySelector() {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.github_access_token) {
      loadRepositories();
    }
  }, [user]);

  const loadRepositories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const github = new GitHubService(user?.github_access_token);
      const repos = await github.getRepositories();
      setRepositories(repos);
    } catch (err) {
      console.error('Error loading repositories:', err);
      setError('Failed to load repositories. Please check your permissions and try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLanguageColor = (language: string | null) => {
    const colors: { [key: string]: string } = {
      JavaScript: 'bg-yellow-500',
      TypeScript: 'bg-blue-500',
      Python: 'bg-green-500',
      Java: 'bg-red-500',
      'C++': 'bg-purple-500',
      CSS: 'bg-pink-500',
      HTML: 'bg-orange-500',
      Go: 'bg-cyan-500',
      Rust: 'bg-orange-600',
      PHP: 'bg-indigo-500',
    };
    return colors[language || ''] || 'bg-gray-500';
  };

  const getModeInfo = (mode: string) => {
    const modeMap: { [key: string]: { title: string; description: string; icon: React.ReactNode; color: string } } = {
      edit: {
        title: 'Edit Project',
        description: 'Select a repository to open in the code editor with AI assistance',
        icon: <Edit3 className="h-6 w-6" />,
        color: 'text-green-400'
      },
      test: {
        title: 'Test Project',
        description: 'Select a repository to analyze code quality and performance',
        icon: <TestTube className="h-6 w-6" />,
        color: 'text-purple-400'
      },
      docs: {
        title: 'Document Project',
        description: 'Select a repository to generate comprehensive documentation',
        icon: <FileText className="h-6 w-6" />,
        color: 'text-orange-400'
      },
      discuss: {
        title: 'Discuss Project',
        description: 'Select a repository to chat with AI about architecture and best practices',
        icon: <MessageSquare className="h-6 w-6" />,
        color: 'text-blue-400'
      }
    };
    return modeMap[mode || 'edit'] || modeMap.edit;
  };

  const handleRepositorySelect = (repo: Repository) => {
    const workspaceUrl = `/workspace?repo=${encodeURIComponent(repo.full_name)}&name=${encodeURIComponent(repo.name)}&description=${encodeURIComponent(repo.description || '')}&branch=${encodeURIComponent(repo.default_branch || 'main')}&mode=${mode}`;
    navigate(workspaceUrl);
  };

  const modeInfo = getModeInfo(mode || 'edit');

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Hub</span>
              </Link>
              <span className="text-gray-400">|</span>
              <div className="flex items-center space-x-3">
                <div className={modeInfo.color}>
                  {modeInfo.icon}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white">{modeInfo.title}</h1>
                  <p className="text-sm text-gray-400">Select a repository to continue</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <img
                src={user?.avatar_url}
                alt={user?.github_username}
                className="h-8 w-8 rounded-full"
              />
              <span className="text-gray-300">{user?.github_username}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Description */}
        <div className="mb-8 text-center">
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {modeInfo.description}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Repositories Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-red-400 mb-4">{error}</div>
            <button
              onClick={loadRepositories}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRepositories.map((repo) => (
              <div
                key={repo.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-all duration-200 cursor-pointer group hover:shadow-lg"
                onClick={() => handleRepositorySelect(repo)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Folder className="h-5 w-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                      {repo.name}
                    </h3>
                  </div>
                  {repo.private && (
                    <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-1 rounded">
                      Private
                    </span>
                  )}
                </div>
                
                <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                  {repo.description || 'No description available'}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    {repo.language && (
                      <div className="flex items-center space-x-1">
                        <div className={`w-3 h-3 rounded-full ${getLanguageColor(repo.language)}`}></div>
                        <span>{repo.language}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3" />
                      <span>{repo.stargazers_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <GitFork className="h-3 w-3" />
                      <span>{repo.forks_count}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(repo.updated_at)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex items-center space-x-2 text-blue-400 group-hover:text-blue-300 transition-colors">
                    <Code className="h-4 w-4" />
                    <span className="text-sm font-medium">Open in {modeInfo.title.split(' ')[0]} Mode</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-400 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filteredRepositories.length === 0 && (
          <div className="text-center py-16">
            <Folder className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No repositories found</p>
            <p className="text-gray-500 text-sm mt-2">
              {searchQuery ? 'Try adjusting your search query' : 'Create a repository on GitHub to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}