import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Rocket, 
  Code, 
  Globe, 
  ShoppingCart, 
  User, 
  Calendar, 
  MessageSquare, 
  FileText,
  Building2,
  BookOpen,
  BarChart3,
  Database,
  Clock,
  Mail,
  Copy,
  Star,
  Sparkles
} from 'lucide-react';

interface ProjectGenerationModeProps {
  onProjectCreated: (projectName: string, repoUrl: string, template?: any, aiContext?: any) => void;
}

export function ProjectGenerationMode({ onProjectCreated }: ProjectGenerationModeProps) {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Template options
  const templates = [
    {
      id: 'landing-page',
      name: 'One-Page Landing Page',
      description: 'A single-page website perfect for product launches, events, or simple portfolios',
      icon: <Globe className="h-8 w-8" />,
      color: 'from-blue-600 to-purple-600',
      techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Vite']
    },
    {
      id: 'business-website',
      name: 'Multi-Page Business Website',
      description: 'A comprehensive business website with multiple pages and professional design',
      icon: <Building2 className="h-8 w-8" />,
      color: 'from-green-600 to-teal-600',
      techStack: ['React', 'TypeScript', 'Tailwind CSS', 'React Router']
    },
    {
      id: 'blog-site',
      name: 'Basic Blog/Content Site',
      description: 'A simple yet elegant blog platform for publishing articles and content',
      icon: <BookOpen className="h-8 w-8" />,
      color: 'from-purple-600 to-pink-600',
      techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Markdown']
    },
    {
      id: 'ecommerce-store',
      name: 'Basic E-commerce Store',
      description: 'A foundational e-commerce site with product display and shopping cart',
      icon: <ShoppingCart className="h-8 w-8" />,
      color: 'from-orange-600 to-red-600',
      techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Stripe']
    },
    {
      id: 'dashboard',
      name: 'Simple Dashboard/Admin Panel',
      description: 'A clean dashboard template for internal tools and data visualization',
      icon: <BarChart3 className="h-8 w-8" />,
      color: 'from-indigo-600 to-blue-600',
      techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Chart.js']
    },
    {
      id: 'crud-app',
      name: 'Basic CRUD App',
      description: 'A generic application for managing data with full CRUD operations',
      icon: <Database className="h-8 w-8" />,
      color: 'from-teal-600 to-green-600',
      techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Supabase']
    }
  ];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleGenerateProject = async () => {
    if (!selectedTemplate || !projectName.trim()) return;

    setIsGenerating(true);

    try {
      const template = templates.find(t => t.id === selectedTemplate);
      
      // Simulate project generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create AI context for the generated project
      const aiContext = {
        templateName: template?.name,
        templateId: selectedTemplate,
        projectName: projectName.trim(),
        projectDescription: projectDescription.trim(),
        techStack: template?.techStack || [],
        createdFiles: [
          'src/App.tsx',
          'src/components/Header.tsx',
          'src/components/Footer.tsx',
          'src/styles/globals.css',
          'package.json',
          'README.md'
        ],
        nextSteps: [
          'Customize the design and colors',
          'Add your own content and images',
          'Test the functionality',
          'Deploy to production'
        ]
      };

      // Call the callback with project details
      onProjectCreated(
        projectName.trim(),
        `https://github.com/user/${projectName.trim()}`,
        template,
        aiContext
      );

    } catch (error) {
      console.error('Error generating project:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Hub</span>
              </button>
              
              <div className="flex items-center space-x-3">
                <Rocket className="h-8 w-8 text-blue-400" />
                <h1 className="text-2xl font-bold text-white">Create New Project</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Step 1: Template Selection */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Choose Your Project Template
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`group relative bg-white/5 backdrop-blur-sm border rounded-xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`}></div>
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${template.color} rounded-xl mb-4 text-white shadow-lg`}>
                    {template.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-3">
                    {template.name}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 mb-4 leading-relaxed">
                    {template.description}
                  </p>

                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-2">
                    {template.techStack.map((tech, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-gray-700/50 text-gray-300 rounded"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Selection Indicator */}
                  {selectedTemplate === template.id && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Project Details */}
        {selectedTemplate && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                Project Details
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="my-awesome-project"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Describe your project..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Selected Template Summary */}
                {selectedTemplateData && (
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 bg-gradient-to-br ${selectedTemplateData.color} rounded-lg text-white`}>
                        {selectedTemplateData.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{selectedTemplateData.name}</h4>
                        <p className="text-sm text-gray-400">{selectedTemplateData.description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={handleGenerateProject}
                  disabled={!selectedTemplate || !projectName.trim() || isGenerating}
                  className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Generating Project...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Generate Project with AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}