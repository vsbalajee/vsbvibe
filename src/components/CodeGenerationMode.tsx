import { useState, useEffect } from 'react';
import { 
  Code, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb,
  FileText,
  Plus,
  Wand2,
  Sparkles,
  ArrowRight,
  Copy,
  Download,
  Save,
  Eye,
  EyeOff,
  Settings,
  Layers,
  Component,
  Layout,
  Palette,
  Database,
  Globe,
  Mail,
  ShoppingCart,
  User,
  MessageSquare,
  Calendar,
  TestTube,
  Shield,
  Zap
} from 'lucide-react';
import { openRouterAI } from '../lib/ai';

interface GeneratedFile {
  path: string;
  content: string;
  operation: 'create' | 'modify' | 'patch';
  language?: string;
  description: string;
}

interface CodeGenerationModeProps {
  files: Array<{ name: string; type: string; path: string; content?: string }>;
  repository?: { name: string; description: string; fullName: string };
  selectedFile?: { name: string; path: string; content: string; language: string };
  onFileCreate?: (path: string, content: string) => void;
  onFileModify?: (path: string, content: string) => void;
  projectContext?: any;
  templateName?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  projectMemory?: any;
}

export function CodeGenerationMode({
  files,
  repository,
  selectedFile,
  onFileCreate,
  onFileModify,
  projectContext,
  templateName,
  conversationHistory = [],
  projectMemory
}: CodeGenerationModeProps) {
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [suggestion, setSuggestion] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [generationMode, setGenerationMode] = useState<'guided' | 'custom'>('guided');

  // Feature templates for guided generation
  const featureTemplates = {
    hero_section: {
      name: 'Hero Section',
      icon: <Layout className="h-5 w-5" />,
      description: 'Create a compelling hero section with headline, subheadline, and CTA',
      prompt: `Create a modern, responsive hero section for my ${templateName || 'website'} with:
1. Compelling headline that captures attention
2. Engaging subheadline that explains the value proposition
3. Prominent call-to-action button
4. Professional styling with Tailwind CSS
5. Responsive design for all devices
6. Modern animations and hover effects

Please generate the complete React component with TypeScript and integrate it into the existing App.tsx file.`
    },
    contact_form: {
      name: 'Contact Form',
      icon: <Mail className="h-5 w-5" />,
      description: 'Build a professional contact form with validation',
      prompt: `Create a professional contact form for my ${templateName || 'website'} with:
1. Form fields: name, email, subject, message
2. Form validation with error messages
3. Professional styling with Tailwind CSS
4. Success/error state handling
5. Responsive design
6. Accessibility features (ARIA labels, keyboard navigation)
7. Form submission handling (with placeholder for backend integration)

Please generate the complete React component with TypeScript and integrate it into the project.`
    },
    navigation: {
      name: 'Navigation Menu',
      icon: <Component className="h-5 w-5" />,
      description: 'Create a responsive navigation menu',
      prompt: `Create a modern navigation menu for my ${templateName || 'website'} with:
1. Responsive design (desktop and mobile)
2. Logo/brand area
3. Navigation links
4. Mobile hamburger menu
5. Smooth animations and transitions
6. Professional styling with Tailwind CSS
7. Active state indicators

Please generate the complete navigation component and integrate it into the App.tsx.`
    },
    footer: {
      name: 'Footer Section',
      icon: <Layers className="h-5 w-5" />,
      description: 'Build a comprehensive footer with links and info',
      prompt: `Create a professional footer for my ${templateName || 'website'} with:
1. Company/brand information
2. Navigation links organized in columns
3. Social media links
4. Contact information
5. Copyright notice
6. Responsive design
7. Professional styling with Tailwind CSS

Please generate the complete footer component and integrate it into the project.`
    },
    testimonials: {
      name: 'Testimonials Section',
      icon: <MessageSquare className="h-5 w-5" />,
      description: 'Add customer testimonials for social proof',
      prompt: `Create a testimonials section for my ${templateName || 'website'} with:
1. Customer testimonial cards
2. Customer photos and names
3. Star ratings
4. Responsive grid or carousel layout
5. Professional styling with Tailwind CSS
6. Smooth animations
7. Sample testimonial data

Please generate the complete testimonials component and integrate it into the project.`
    },
    pricing: {
      name: 'Pricing Section',
      icon: <Database className="h-5 w-5" />,
      description: 'Create pricing plans and packages',
      prompt: `Create a pricing section for my ${templateName || 'website'} with:
1. Multiple pricing tiers/plans
2. Feature comparison
3. Highlighted popular plan
4. Call-to-action buttons
5. Professional styling with Tailwind CSS
6. Responsive design
7. Sample pricing data

Please generate the complete pricing component and integrate it into the project.`
    },
    gallery: {
      name: 'Image Gallery',
      icon: <Eye className="h-5 w-5" />,
      description: 'Build an interactive image gallery',
      prompt: `Create an image gallery for my ${templateName || 'website'} with:
1. Responsive grid layout
2. Image modal/lightbox functionality
3. Image categories/filtering
4. Lazy loading for performance
5. Professional styling with Tailwind CSS
6. Smooth animations and transitions
7. Sample images and data

Please generate the complete gallery component and integrate it into the project.`
    },
    about: {
      name: 'About Section',
      icon: <User className="h-5 w-5" />,
      description: 'Create an engaging about section',
      prompt: `Create an about section for my ${templateName || 'website'} with:
1. Company/personal story
2. Mission and values
3. Team member cards (if applicable)
4. Professional styling with Tailwind CSS
5. Responsive design
6. Engaging visuals and layout
7. Sample content

Please generate the complete about component and integrate it into the project.`
    },
    services: {
      name: 'Services Section',
      icon: <Settings className="h-5 w-5" />,
      description: 'Showcase services or features',
      prompt: `Create a services section for my ${templateName || 'website'} with:
1. Service/feature cards
2. Icons and descriptions
3. Professional styling with Tailwind CSS
4. Responsive grid layout
5. Hover effects and animations
6. Call-to-action elements
7. Sample service data

Please generate the complete services component and integrate it into the project.`
    },
    ecommerce_catalog: {
      name: 'Product Catalog',
      icon: <ShoppingCart className="h-5 w-5" />,
      description: 'Build a complete product catalog system',
      prompt: `Create a product catalog system for my ${templateName || 'ecommerce site'} with:
1. Product grid layout with responsive design
2. Product cards with images, titles, prices, and ratings
3. Product filtering by category, price range, and ratings
4. Search functionality
5. Sort options (price, popularity, newest)
6. Add to cart functionality
7. Professional styling with Tailwind CSS
8. Sample product data

Please generate the complete product catalog components and integrate them into the project.`
    },
    shopping_cart: {
      name: 'Shopping Cart',
      icon: <ShoppingCart className="h-5 w-5" />,
      description: 'Implement shopping cart functionality',
      prompt: `Create a shopping cart system for my ${templateName || 'ecommerce site'} with:
1. Cart sidebar/modal with item list
2. Add/remove items functionality
3. Quantity adjustment controls
4. Price calculations (subtotal, tax, total)
5. Cart persistence using localStorage
6. Responsive design
7. Professional styling with Tailwind CSS
8. Checkout button integration

Please generate the complete shopping cart components and integrate them into the project.`
    },
    blog_system: {
      name: 'Blog System',
      icon: <FileText className="h-5 w-5" />,
      description: 'Create a complete blog system',
      prompt: `Create a blog system for my ${templateName || 'blog site'} with:
1. Blog post listing page with pagination
2. Individual blog post pages
3. Categories and tags system
4. Search functionality
5. Recent posts sidebar
6. Responsive design
7. Professional styling with Tailwind CSS
8. Sample blog posts and content

Please generate the complete blog system components and integrate them into the project.`
    },
    dashboard_charts: {
      name: 'Dashboard Charts',
      icon: <BarChart3 className="h-5 w-5" />,
      description: 'Add data visualization charts',
      prompt: `Create a dashboard with charts for my ${templateName || 'dashboard'} with:
1. Multiple chart types (bar, line, pie, area)
2. Responsive chart containers
3. Interactive tooltips and legends
4. Data filtering and date range selection
5. Professional styling with Tailwind CSS
6. Sample data and metrics
7. Chart.js or similar library integration
8. Mobile-friendly responsive design

Please generate the complete dashboard components with charts and integrate them into the project.`
    }
  };

  // Auto-detect feature requests from conversation history
  useEffect(() => {
    if (conversationHistory.length > 0) {
      const lastUserMessage = conversationHistory
        .filter(msg => msg.role === 'user')
        .pop()?.content.toLowerCase() || '';

      // Auto-select feature based on conversation
      if (lastUserMessage.includes('contact form')) {
        setSelectedFeature('contact_form');
        setGenerationPrompt(featureTemplates.contact_form.prompt);
      } else if (lastUserMessage.includes('hero section')) {
        setSelectedFeature('hero_section');
        setGenerationPrompt(featureTemplates.hero_section.prompt);
      } else if (lastUserMessage.includes('navigation')) {
        setSelectedFeature('navigation');
        setGenerationPrompt(featureTemplates.navigation.prompt);
      } else if (lastUserMessage.includes('testimonials')) {
        setSelectedFeature('testimonials');
        setGenerationPrompt(featureTemplates.testimonials.prompt);
      } else if (lastUserMessage.includes('product') || lastUserMessage.includes('catalog')) {
        setSelectedFeature('ecommerce_catalog');
        setGenerationPrompt(featureTemplates.ecommerce_catalog.prompt);
      } else if (lastUserMessage.includes('cart') || lastUserMessage.includes('shopping')) {
        setSelectedFeature('shopping_cart');
        setGenerationPrompt(featureTemplates.shopping_cart.prompt);
      } else if (lastUserMessage.includes('blog') || lastUserMessage.includes('post')) {
        setSelectedFeature('blog_system');
        setGenerationPrompt(featureTemplates.blog_system.prompt);
      } else if (lastUserMessage.includes('chart') || lastUserMessage.includes('dashboard')) {
        setSelectedFeature('dashboard_charts');
        setGenerationPrompt(featureTemplates.dashboard_charts.prompt);
      }
    }
  }, [conversationHistory]);

  const handleFeatureSelect = (featureKey: string) => {
    setSelectedFeature(featureKey);
    const feature = featureTemplates[featureKey as keyof typeof featureTemplates];
    if (feature) {
      setGenerationPrompt(feature.prompt);
      setGenerationMode('guided');
    }
  };

  const generateCode = async () => {
    if (!generationPrompt.trim()) return;

    setIsGenerating(true);
    setGeneratedFiles([]);
    setSuggestion('');

    try {
      // Enhanced context for code generation
      const enhancedContext = {
        currentFile: selectedFile,
        projectStructure: files,
        repository,
        projectContext,
        conversationHistory,
        selectedFeature,
        templateName,
        projectMemory,
        generationMode,
        featureContext: selectedFeature ? featureTemplates[selectedFeature as keyof typeof featureTemplates] : null
      };

      const result = await openRouterAI.generateCode(generationPrompt, enhancedContext);

      setSuggestion(result.suggestion);
      setGeneratedFiles(result.files.map(file => ({
        ...file,
        description: file.operation === 'create' ? `New ${file.language} file` : `Updated ${file.language} file`
      })));

    } catch (error) {
      console.error('Error generating code:', error);
      setSuggestion('Failed to generate code. Please try again with a different prompt.');
    } finally {
      setIsGenerating(false);
    }
  };

  const applyGeneratedFile = async (file: GeneratedFile) => {
    try {
      if (file.operation === 'create') {
        onFileCreate?.(file.path, file.content);
      } else {
        onFileModify?.(file.path, file.content);
      }
      
      // Show success feedback
      const button = document.activeElement as HTMLButtonElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = '✅ Applied!';
        button.style.backgroundColor = '#10b981';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
        }, 2000);
      }
    } catch (error) {
      console.error('Error applying file:', error);
    }
  };

  const applyAllFiles = async () => {
    const button = document.activeElement as HTMLButtonElement;
    const originalText = button?.textContent || '';
    const totalFiles = generatedFiles.length;
    
    try {
      // Show loading state
      if (button) {
        button.disabled = true;
        button.textContent = `🔄 Applying ${totalFiles} files...`;
      }
      
      // Apply all files with progress updates
      for (let i = 0; i < generatedFiles.length; i++) {
        const file = generatedFiles[i];
        if (file.operation === 'create') {
          onFileCreate?.(file.path, file.content);
        } else {
          onFileModify?.(file.path, file.content);
        }
        
        // Update progress
        if (button) {
          button.textContent = `🔄 Applied ${i + 1}/${totalFiles}...`;
        }
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    
      // Clear generated files after applying
      setGeneratedFiles([]);
      setSuggestion('');
      
      // Show success feedback
      if (button) {
        button.textContent = `✅ Applied All ${totalFiles} Files!`;
        button.style.backgroundColor = '#10b981';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
          button.disabled = false;
        }, 3000);
      }
      
    } catch (error) {
      console.error('❌ Error applying all files:', error);
      
      // Show error feedback
      if (button) {
        button.textContent = '❌ Apply Failed';
        button.style.backgroundColor = '#ef4444';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
          button.disabled = false;
        }, 3000);
      }
    }
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Show feedback
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <Wand2 className="h-6 w-6 text-green-400" />
          <h2 className="text-xl font-semibold text-white">Code Generation</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setGenerationMode(generationMode === 'guided' ? 'custom' : 'guided')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              generationMode === 'guided' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {generationMode === 'guided' ? 'Guided' : 'Custom'}
          </button>
          
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Feature Selection Panel */}
        <div className="w-80 border-r border-gray-700 flex flex-col">
          <div className="p-4">
            <h3 className="font-medium text-white mb-3">
              {generationMode === 'guided' ? 'Select Feature to Build' : 'Custom Generation'}
            </h3>
            
            {generationMode === 'guided' ? (
              <div className="space-y-2">
                {Object.entries(featureTemplates).map(([key, feature]) => (
                  <button
                    key={key}
                    onClick={() => {
                      handleFeatureSelect(key);
                      // Auto-generate code when feature is selected
                      setTimeout(() => {
                        if (generationPrompt.trim()) {
                          generateCode();
                        }
                      }, 100);
                    }}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                      selectedFeature === key
                        ? 'bg-blue-600/20 border border-blue-500 text-blue-300'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                    }`}
                  >
                    <div className="text-blue-400">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{feature.name}</div>
                      <div className="text-xs text-gray-500">{feature.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={generationPrompt}
                  onChange={(e) => setGenerationPrompt(e.target.value)}
                  placeholder="Describe what you want to build..."
                  className="w-full h-32 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            )}

            {/* Generation Button */}
            <button
              onClick={generateCode}
              disabled={!generationPrompt.trim() || isGenerating}
              className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>
                {isGenerating ? 'Generating...' : 'Generate Code'}
              </span>
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="flex-1 flex flex-col">
          {suggestion && (
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-start space-x-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <Lightbulb className="h-5 w-5 text-green-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-white mb-1">Generation Complete</h3>
                  <p className="text-sm text-green-300">{suggestion}</p>
                </div>
              </div>
            </div>
          )}

          {generatedFiles.length > 0 && (
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">Generated Files ({generatedFiles.length})</h3>
                <button
                  onClick={applyAllFiles}
                  className="flex items-center space-x-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                >
                  <CheckCircle className="h-3 w-3" />
                  <span>Apply All</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {generatedFiles.length > 0 ? (
              <div className="p-4 space-y-4">
                {generatedFiles.map((file, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg border border-gray-700">
                    {/* File Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-700">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-400" />
                        <div>
                          <h4 className="font-medium text-white">{file.path}</h4>
                          <p className="text-sm text-gray-400">{file.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          file.operation === 'create' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {file.operation.toUpperCase()}
                        </span>
                        
                        <button
                          onClick={() => copyToClipboard(file.content)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => applyGeneratedFile(file)}
                          className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Apply</span>
                        </button>
                      </div>
                    </div>

                    {/* File Content Preview */}
                    <div className="p-4">
                      <div className="bg-gray-900 border border-gray-600 rounded p-3 text-sm text-gray-300 overflow-auto max-h-64">
                        <pre className="whitespace-pre-wrap">
                          <code>{file.content}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !isGenerating ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Wand2 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-400 mb-2">Ready to Generate Code</h3>
                  <p className="text-gray-500">
                    {generationMode === 'guided' 
                      ? 'Select a feature to build or switch to custom mode'
                      : 'Describe what you want to build in the prompt area'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="h-12 w-12 animate-spin text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">Generating Code...</h3>
                  <p className="text-gray-500">AI is creating your feature implementation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}