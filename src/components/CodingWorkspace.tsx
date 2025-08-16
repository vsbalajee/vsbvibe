import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GitHubService } from '../lib/github';
import { openRouterAI } from '../lib/ai';
import { projectAnalyzer } from '../lib/projectAnalyzer';
import { 
  Folder, 
  FolderOpen, 
  File, 
  Plus, 
  Save, 
  Download, 
  Settings, 
  MessageSquare, 
  Code, 
  TestTube, 
  FileText, 
  RefreshCw, 
  ArrowLeft, 
  Play, 
  GitBranch, 
  ExternalLink,
  Search,
  Filter,
  MoreHorizontal,
  Edit3,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Terminal as TerminalIcon,
  Zap,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Layout,
  Mail,
  ShoppingCart,
  Palette,
  Menu
} from 'lucide-react';

// Import mode components
import { CodeGenerationMode } from './CodeGenerationMode';
import { DocumentationMode } from './DocumentationMode';
import { TestMode } from './TestMode';
import { Terminal } from './Terminal';
import { CodeEditor } from './CodeEditor';
import { FileExplorer } from './FileExplorer';
import { AISettingsModal } from './AISettingsModal';
import { NotificationSystem, useNotifications } from './NotificationSystem';
import { SmartActionSuggestions, useSmartSuggestions } from './SmartActionSuggestions';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  content?: string;
  language?: string;
  sha?: string;
}

interface ProjectWorkspaceProps {
  onInstallDependencies?: (dependencies: string[]) => Promise<void>;
}

interface PredictiveAction {
  id: string;
  text: string;
  type: 'implement' | 'generate' | 'test' | 'document';
  prompt: string;
  icon?: React.ReactNode;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  predictiveActions?: PredictiveAction[];
}

export function ProjectWorkspace({ onInstallDependencies }: ProjectWorkspaceProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Repository info from URL params
  const repoFullName = searchParams.get('repo') || '';
  const repoName = searchParams.get('name') || '';
  const repoDescription = searchParams.get('description') || '';
  const repoBranch = searchParams.get('branch') || 'main';
  const mode = searchParams.get('mode') || 'edit';
  const templateName = searchParams.get('templateName') || '';
  const templateDescription = searchParams.get('templateDescription') || '';
  const initialAIMessage = searchParams.get('initialAIMessage') === 'true';
  const aiContextParam = searchParams.get('aiContext');
  
  // Parse AI context
  let aiContext = null;
  try {
    if (aiContextParam) {
      aiContext = JSON.parse(decodeURIComponent(aiContextParam));
    }
  } catch (error) {
    console.warn('Failed to parse AI context:', error);
  }

  // State management
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());
  const [activeMode, setActiveMode] = useState<'discuss' | 'generate' | 'test' | 'docs'>(
    mode === 'discuss' ? 'discuss' : 
    mode === 'test' ? 'test' : 
    mode === 'docs' ? 'docs' : 'discuss'
  );
  
  // UI state
  const [showTerminal, setShowTerminal] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  
  // Chat and AI state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImplementing, setIsImplementing] = useState(false);
  const [projectContext, setProjectContext] = useState<any>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Track last modified file for contextual suggestions
  const [lastModifiedFile, setLastModifiedFile] = useState<{
    path: string;
    operation: 'create' | 'modify';
    content: string;
    timestamp: Date;
  } | null>(null);

  // Refs
  const resizeRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Hooks
  const {
    notifications,
    dismissNotification,
    showSuccess,
    showError,
    showInfo,
    showFileCreated,
    showFileModified,
    showGitCommit
  } = useNotifications();

  const { generateSuggestions } = useSmartSuggestions();

  // GitHub service
  const github = React.useMemo(() => {
    return user?.github_access_token ? new GitHubService(user.github_access_token) : null;
  }, [user?.github_access_token]);

  // Load repository contents on mount
  useEffect(() => {
    if (repoFullName && github) {
      loadRepositoryContents();
    }
  }, [repoFullName, github]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Analyze project context when files change
  useEffect(() => {
    if (files.length > 0) {
      analyzeProjectContext();
    }
  }, [files]);

  // Send initial AI message for generated projects
  useEffect(() => {
    if (initialAIMessage && aiContext && files.length > 0 && chatMessages.length === 0) {
      sendInitialAIMessage();
    }
  }, [initialAIMessage, aiContext, files, chatMessages]);

  const loadRepositoryContents = async () => {
    if (!github || !repoFullName) return;

    try {
      setLoading(true);
      setError(null);

      const [owner, repo] = repoFullName.split('/');
      const contents = await github.getRepositoryContents(owner, repo, '');
      
      // Handle different response types from GitHub API
      let contentsArray: any[] = [];
      
      if (Array.isArray(contents)) {
        contentsArray = contents;
      } else if (contents && typeof contents === 'object' && 'type' in contents) {
        // Single file response - wrap in array
        contentsArray = [contents];
      } else {
        // Empty repository or unexpected response
        console.log('Repository appears to be empty or newly created');
        setFiles([]);
        setLoading(false);
        return;
      }

      const fileTree = buildFileTree(contentsArray);
      setFiles(fileTree);
      
    } catch (err) {
      console.error('Error loading repository:', err);
      
      // Handle specific GitHub API errors
      if (err instanceof Error) {
        if (err.message.includes('404')) {
          setError('Repository not found. Please check if the repository exists and you have access to it.');
        } else if (err.message.includes('403')) {
          setError('Access denied. Please check your GitHub permissions.');
        } else if (err.message.includes('rate limit')) {
          setError('GitHub API rate limit exceeded. Please try again later.');
        } else {
          setError(`Failed to load repository: ${err.message}`);
        }
      } else {
        setError('Failed to load repository. Please try again.');
      }
      
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const buildFileTree = (contentsArray: any[]): FileNode[] => {
    try {
      return contentsArray.map((item: any) => ({
        id: item.path || item.name || Math.random().toString(),
        name: item.name || 'Unknown',
        type: item.type === 'dir' ? 'folder' : 'file',
        path: item.path || item.name || '',
        sha: item.sha,
        language: item.type === 'file' ? getLanguageFromPath(item.path || item.name || '') : undefined
      }));
    } catch (error) {
      console.error('Error building file tree:', error);
      return [];
    }
  };

  const loadFileContent = async (file: FileNode) => {
    if (!github || !repoFullName || file.type !== 'file') return;

    try {
      setIsLoadingFile(true);
      const [owner, repo] = repoFullName.split('/');
      const content = await github.getFileContent(owner, repo, file.path);
      
      if ('content' in content && content.content) {
        const decodedContent = atob(content.content);
        setFileContent(decodedContent);
        
        // Update file node with content
        setFiles(prevFiles => updateFileInTree(prevFiles, file.path, { content: decodedContent }));
      }
    } catch (err) {
      console.error('Error loading file content:', err);
      showError('Failed to load file', `Could not load content for ${file.name}`);
    } finally {
      setIsLoadingFile(false);
    }
  };

  const updateFileInTree = (files: FileNode[], path: string, updates: Partial<FileNode>): FileNode[] => {
    return files.map(file => {
      if (file.path === path) {
        return { ...file, ...updates };
      }
      if (file.children) {
        return { ...file, children: updateFileInTree(file.children, path, updates) };
      }
      return file;
    });
  };

  const handleFileSelect = async (file: FileNode) => {
    setSelectedFile(file);
    if (file.type === 'file' && !file.content) {
      await loadFileContent(file);
    } else if (file.content) {
      setFileContent(file.content);
    }
  };

  const handleFolderExpand = async (folder: FileNode) => {
    if (!github || !repoFullName) return;

    const folderId = folder.id;
    const newExpanded = new Set(expandedFolders);
    
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
      
      // Load folder contents if not already loaded
      if (!folder.children) {
        setLoadingFolders(prev => new Set([...prev, folder.path]));
        
        try {
          const [owner, repo] = repoFullName.split('/');
          const contents = await github.getRepositoryContents(owner, repo, folder.path);
          
          if (Array.isArray(contents)) {
            const children = buildFileTree(contents);
            setFiles(prevFiles => updateFileInTree(prevFiles, folder.path, { children }));
          }
        } catch (err) {
          console.error('Error loading folder contents:', err);
          showError('Failed to load folder', `Could not load contents of ${folder.name}`);
        } finally {
          setLoadingFolders(prev => {
            const newSet = new Set(prev);
            newSet.delete(folder.path);
            return newSet;
          });
        }
      }
    }
    
    setExpandedFolders(newExpanded);
  };

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml'
    };
    return langMap[ext || ''] || 'text';
  };

  const analyzeProjectContext = async () => {
    try {
      const context = await projectAnalyzer.analyzeProject(
        files.map(f => ({ name: f.name, type: f.type, path: f.path, content: f.content })),
        { name: repoName, description: repoDescription, fullName: repoFullName }
      );
      setProjectContext(context);
    } catch (error) {
      console.error('Error analyzing project context:', error);
    }
  };

  const sendInitialAIMessage = async () => {
    if (!aiContext) return;

    const initialMessage = `🎉 I've successfully created your **${aiContext.templateName}** project! Here's what I've set up for you:

**Project Structure:**
${aiContext.createdFiles?.map((file: string) => `• ${file}`).join('\n') || '• Basic project files'}

**Technology Stack:**
${aiContext.techStack?.map((tech: string) => `• ${tech}`).join('\n') || '• Modern web technologies'}

**Ready to start building?** Here are some great next steps:
${aiContext.nextSteps?.map((step: string, index: number) => `${index + 1}. ${step}`).join('\n') || '1. Customize the design\n2. Add your content\n3. Test the functionality'}

I'm ready to help you build something amazing! 🚀`;

    // Generate predictive actions based on template
    const predictiveActions = generateInitialPredictiveActions(aiContext);
    const newMessage = {
      role: 'assistant' as const,
      content: initialMessage,
      timestamp: new Date(),
      predictiveActions
    };

    setChatMessages([newMessage]);
    setConversationHistory([{ role: 'assistant', content: initialMessage }]);
  };

  // Generate initial predictive actions based on AI context
  const generateInitialPredictiveActions = (aiContext: any): PredictiveAction[] => {
    const actions: PredictiveAction[] = [];
    const templateName = aiContext.templateName?.toLowerCase() || '';

    if (templateName.includes('landing') || templateName.includes('one-page')) {
      actions.push({
        id: 'create-hero-section',
        text: 'Create Hero Section',
        type: 'implement',
        prompt: 'Create a modern, responsive hero section with compelling headline, engaging subheadline, and prominent call-to-action button. Use Tailwind CSS for styling.',
        icon: <Layout className="h-3 w-3" />
      });
      actions.push({
        id: 'add-contact-form',
        text: 'Add Contact Form',
        type: 'implement',
        prompt: 'Create a professional contact form with name, email, subject, and message fields. Include form validation and success/error handling.',
        icon: <Mail className="h-3 w-3" />
      });
    } else if (templateName.includes('ecommerce') || templateName.includes('store')) {
      actions.push({
        id: 'setup-product-catalog',
        text: 'Setup Product Catalog',
        type: 'implement',
        prompt: 'Create a product catalog system with product listings, images, descriptions, pricing, and basic filtering functionality.',
        icon: <ShoppingCart className="h-3 w-3" />
      });
    } else if (templateName.includes('blog')) {
      actions.push({
        id: 'create-blog-system',
        text: 'Create Blog System',
        type: 'implement',
        prompt: 'Set up a blog system with post creation, listing, and detail views. Include categories and tags.',
        icon: <FileText className="h-3 w-3" />
      });
    }

    // Always add these common actions
    actions.push({
      id: 'customize-design',
      text: 'Customize Design',
      type: 'implement',
      prompt: 'Help me customize the design of this project. Update colors, fonts, and overall visual appearance to make it modern and appealing.',
      icon: <Palette className="h-3 w-3" />
    });

    return actions.slice(0, 3); // Limit to 3 actions
  };

  // Generate predictive actions for any AI response
  const generatePredictiveActionsForResponse = (
    userPrompt: string,
    aiResponse: string,
    currentMode: 'discuss' | 'generate' | 'test' | 'docs',
    templateName?: string,
    projectContext?: any,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
    lastModifiedFile?: { path: string; operation: 'create' | 'modify'; content: string; timestamp: Date } | null
  ): PredictiveAction[] => {
    const actions: PredictiveAction[] = [];
    const lowerPrompt = userPrompt.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();

    // Create a Set to track unique suggestion IDs to prevent duplicates
    const addedSuggestions = new Set<string>();
    
    // Generate contextual suggestions based on last modified file
    if (lastModifiedFile && (Date.now() - lastModifiedFile.timestamp.getTime()) < 300000) { // Within 5 minutes
      const fileName = lastModifiedFile.path.split('/').pop() || '';
      const fileExt = fileName.split('.').pop()?.toLowerCase();
      
      if (lastModifiedFile.operation === 'create') {
        // Suggestions for newly created files
        if (addedSuggestions.has('style-new-component')) return actions;
        addedSuggestions.add('style-new-component');
        
        if (fileExt === 'tsx' || fileExt === 'jsx') {
          actions.push({
            id: 'style-new-component',
            text: 'Style this component',
            type: 'implement',
            prompt: `Add professional styling and improve the visual design of the ${fileName} component I just created. Make it look modern and responsive with Tailwind CSS.`,
            icon: <Palette className="h-3 w-3" />
          });
          
          if (addedSuggestions.has('add-interactivity')) return actions;
          addedSuggestions.add('add-interactivity');
          
          actions.push({
            id: 'add-interactivity',
            text: 'Add interactivity',
            type: 'implement',
            prompt: `Add interactive features, animations, and user interactions to the ${fileName} component I just created.`,
            icon: <Zap className="h-3 w-3" />
          });
        }
        
        if (fileName.toLowerCase().includes('form')) {
          if (addedSuggestions.has('enhance-form-validation')) return actions;
          addedSuggestions.add('enhance-form-validation');
          
          actions.push({
            id: 'enhance-form-validation',
            text: 'Enhance form validation',
            type: 'implement',
            prompt: `Improve the form validation and error handling for the ${fileName} I just created. Add better user feedback and validation messages.`,
            icon: <Shield className="h-3 w-3" />
          });
        }
      } else if (lastModifiedFile.operation === 'modify') {
        // Suggestions for modified files
        if (addedSuggestions.has('refine-recent-changes')) return actions;
        addedSuggestions.add('refine-recent-changes');
        
        actions.push({
          id: 'refine-recent-changes',
          text: 'Refine recent changes',
          type: 'implement',
          prompt: `Review and refine the recent changes I made to ${fileName}. Optimize the code, improve performance, and ensure best practices.`,
          icon: <RefreshCw className="h-3 w-3" />
        });
        
        if (addedSuggestions.has('add-related-features')) return actions;
        addedSuggestions.add('add-related-features');
        
        actions.push({
          id: 'add-related-features',
          text: 'Add related features',
          type: 'implement',
          prompt: `Based on the recent changes to ${fileName}, suggest and implement related features that would complement this functionality.`,
          icon: <Plus className="h-3 w-3" />
        });
      }
    }
    // Implementation suggestions based on conversation
    if (lowerPrompt.includes('hero') || lowerResponse.includes('hero')) {
      if (addedSuggestions.has('implement-hero')) return actions;
      addedSuggestions.add('implement-hero');
      
      actions.push({
        id: 'implement-hero',
        text: 'Implement Hero Section',
        type: 'implement',
        prompt: 'Create a modern hero section with compelling headline, subheadline, and call-to-action button.',
        icon: <Layout className="h-3 w-3" />
      });
    }

    if (lowerPrompt.includes('contact') || lowerResponse.includes('contact')) {
      if (addedSuggestions.has('implement-contact')) return actions;
      addedSuggestions.add('implement-contact');
      
      actions.push({
        id: 'implement-contact',
        text: 'Add Contact Form',
        type: 'implement',
        prompt: 'Create a professional contact form with validation and email handling.',
        icon: <Mail className="h-3 w-3" />
      });
    }

    if (lowerPrompt.includes('product') || lowerResponse.includes('product')) {
      if (addedSuggestions.has('implement-products')) return actions;
      addedSuggestions.add('implement-products');
      
      actions.push({
        id: 'implement-products',
        text: 'Create Product System',
        type: 'implement',
        prompt: 'Set up a product catalog with listings, details, and shopping functionality.',
        icon: <ShoppingCart className="h-3 w-3" />
      });
    }

    if (lowerPrompt.includes('design') || lowerPrompt.includes('style') || lowerResponse.includes('design')) {
      if (addedSuggestions.has('customize-design')) return actions;
      addedSuggestions.add('customize-design');
      
      actions.push({
        id: 'customize-design',
        text: 'Customize Design',
        type: 'implement',
        prompt: 'Improve the visual design with better colors, typography, and layout.',
        icon: <Palette className="h-3 w-3" />
      });
    }

    if (lowerPrompt.includes('navigation') || lowerResponse.includes('navigation')) {
      if (addedSuggestions.has('implement-navigation')) return actions;
      addedSuggestions.add('implement-navigation');
      
      actions.push({
        id: 'implement-navigation',
        text: 'Add Navigation',
        type: 'implement',
        prompt: 'Create a responsive navigation menu with mobile hamburger menu.',
        icon: <Menu className="h-3 w-3" />
      });
    }

    // Remove duplicates and limit to 3 actions
    const uniqueActions = actions.filter((action, index, self) => 
      index === self.findIndex(a => a.id === action.id)
    );
    
    return uniqueActions.slice(0, 3);
  };

  const handlePredictiveAction = async (action: PredictiveAction) => {
    if (!action.prompt) return;

    setIsImplementing(true);
    
    try {
      if (action.type === 'implement' || action.id === 'implement-plan') {
        // Generate and apply code directly
        console.log('🚀 Starting implementation for action:', action.id);
        
        const result = await openRouterAI.generateCode(
          action.prompt,
          {
            currentFile: selectedFile ? {
              name: selectedFile.name,
              path: selectedFile.path,
              content: fileContent,
              language: selectedFile.language || 'text'
            } : undefined,
            projectStructure: files.map(f => ({ name: f.name, type: f.type, path: f.path, content: f.content })),
            repository: { name: repoName, description: repoDescription, fullName: repoFullName },
            projectContext,
            templateName,
            conversationHistory,
            lastModifiedFile
          }
        );

        console.log('✅ AI generated result:', { 
          suggestion: result.suggestion?.substring(0, 100) + '...', 
          filesCount: result.files?.length || 0 
        });

        // Validate the result
        if (!result || !result.files || !Array.isArray(result.files)) {
          throw new Error('Invalid response from AI - no files generated');
        }

        // Apply all generated files
        for (const file of result.files) {
          console.log(`📝 Applying file: ${file.path} (${file.operation})`);
          if (file.operation === 'create') {
            await handleFileCreate(file.path, file.content);
          } else {
            await handleFileModify(file.path, file.content);
          }
        }

        console.log('✅ All files applied successfully');

        // Add success message to chat
        const successMessage = {
          role: 'assistant' as const,
          content: `✅ **Plan Implemented Successfully!**\n\n${result.suggestion}\n\nI've automatically generated and applied the code to your repository. All files have been created/modified and the implementation is complete!`,
          timestamp: new Date(),
          predictiveActions: generatePredictiveActionsForResponse(
            action.prompt,
            result.suggestion,
            activeMode,
            templateName,
            projectContext,
            conversationHistory,
            lastModifiedFile
          )
        };

        setChatMessages(prev => [...prev, successMessage]);
        setConversationHistory(prev => [...prev, { role: 'assistant', content: successMessage.content }]);

      } else if (action.type === 'test') {
        setActiveMode('test');
      } else if (action.type === 'document') {
        setActiveMode('docs');
      }
    } catch (error) {
      console.error('Error handling predictive action:', error);
      
      const errorMessage = {
        role: 'assistant' as const,
        content: `❌ **Plan Implementation Failed**\n\nI encountered an error while implementing the plan: ${error instanceof Error ? error.message : 'Unknown error'}\n\nLet me know if you'd like me to try a different approach or modify the implementation!`,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorMessage]);
      setConversationHistory(prev => [...prev, { role: 'assistant', content: errorMessage.content }]);
    } finally {
      setIsImplementing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isProcessing) return;

    const userMessage = {
      role: 'user' as const,
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setConversationHistory(prev => [...prev, { role: 'user', content: currentMessage }]);
    
    const messageToProcess = currentMessage;
    setCurrentMessage('');
    setIsProcessing(true);

    try {
      // Check if the user is asking for code implementation
      const isCodeRequest = messageToProcess.toLowerCase().includes('create') ||
                           messageToProcess.toLowerCase().includes('add') ||
                           messageToProcess.toLowerCase().includes('implement') ||
                           messageToProcess.toLowerCase().includes('build') ||
                           messageToProcess.toLowerCase().includes('make') ||
                           messageToProcess.toLowerCase().includes('generate') ||
                           messageToProcess.toLowerCase().includes('write') ||
                           messageToProcess.toLowerCase().includes('code');

      if (isCodeRequest) {
        // Generate and apply code directly instead of chatting about it
        const result = await openRouterAI.generateCode(
          messageToProcess,
          {
            currentFile: selectedFile ? {
              name: selectedFile.name,
              path: selectedFile.path,
              content: fileContent,
              language: selectedFile.language || 'text'
            } : undefined,
            projectStructure: files.map(f => ({ name: f.name, type: f.type, path: f.path, content: f.content })),
            repository: { name: repoName, description: repoDescription, fullName: repoFullName },
            projectContext,
            conversationHistory,
            selectedTemplate: templateName,
            mode: activeMode
          }
        );

        // Validate the result before proceeding
        if (!result || !result.files || !Array.isArray(result.files)) {
          throw new Error('Invalid response from AI - no files generated');
        }

        // Apply all generated files to repository
        let appliedFiles = 0;
        for (const file of result.files) {
          try {
            if (file.operation === 'create') {
              await handleFileCreate(file.path, file.content);
            } else {
              await handleFileModify(file.path, file.content);
            }
            appliedFiles++;
          } catch (error) {
            console.error(`Error applying file ${file.path}:`, error);
          }
        }

        // Generate predictive actions for the implementation
        const predictiveActions = generatePredictiveActionsForResponse(
          messageToProcess,
          result.suggestion,
          activeMode,
          templateName,
          projectContext,
          conversationHistory,
          lastModifiedFile
        );

        // Show success message in chat (no code, just confirmation)
        const successMessage = {
          role: 'assistant' as const,
          content: `✅ **Implementation Complete!**\n\n${result.suggestion}\n\nI've successfully implemented your request and applied ${appliedFiles} file(s) to your repository. The changes are now live in your project!`,
          timestamp: new Date(),
          predictiveActions
        };

        setChatMessages(prev => [...prev, successMessage]);
        setConversationHistory(prev => [...prev, { role: 'assistant', content: successMessage.content }]);

      } else {
        // For non-code requests, use regular chat discussion
        const response = await openRouterAI.chatDiscussion(
          messageToProcess,
          {
            currentFile: selectedFile ? {
              name: selectedFile.name,
              path: selectedFile.path,
              content: fileContent,
              language: selectedFile.language || 'text'
            } : undefined,
            projectStructure: files.map(f => ({ name: f.name, type: f.type, path: f.path, content: f.content })),
            repository: { name: repoName, description: repoDescription, fullName: repoFullName },
            projectContext,
            conversationHistory,
            selectedTemplate: templateName,
            mode: activeMode
          }
        );

        // Generate predictive actions for every AI response
        const predictiveActions = generatePredictiveActionsForResponse(
          messageToProcess,
          response,
          activeMode,
          templateName,
          projectContext,
          conversationHistory,
          lastModifiedFile
        );

        const assistantMessage = {
          role: 'assistant' as const,
          content: response,
          timestamp: new Date(),
          predictiveActions
        };

        setChatMessages(prev => [...prev, assistantMessage]);
        setConversationHistory(prev => [...prev, { role: 'assistant', content: response }]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      showError('AI Error', 'Failed to get AI response. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileCreate = async (path: string, content: string) => {
    if (!github || !repoFullName) return;

    try {
      const [owner, repo] = repoFullName.split('/');
      await github.createOrUpdateFile(owner, repo, path, content, `Create ${path}`);
      showFileCreated(path);
      
      // Track last modified file for contextual suggestions
      setLastModifiedFile({
        path,
        operation: 'create',
        content,
        timestamp: new Date()
      });
      
      // Refresh repository contents
      await loadRepositoryContents();
    } catch (error) {
      console.error('Error creating file:', error);
      showError('Failed to create file', `Could not create ${path}`);
    }
  };

  const handleFileModify = async (path: string, content: string) => {
    if (!github || !repoFullName) return;

    try {
      const [owner, repo] = repoFullName.split('/');
      const file = findFileByPath(files, path);
      await github.createOrUpdateFile(owner, repo, path, content, `Update ${path}`, file?.sha);
      showFileModified(path);
      
      // Track last modified file for contextual suggestions
      setLastModifiedFile({
        path,
        operation: 'modify',
        content,
        timestamp: new Date()
      });
      
      // Update local file content
      setFiles(prevFiles => updateFileInTree(prevFiles, path, { content }));
      if (selectedFile?.path === path) {
        setFileContent(content);
      }
    } catch (error) {
      console.error('Error modifying file:', error);
      showError('Failed to modify file', `Could not update ${path}`);
    }
  };

  const findFileByPath = (files: FileNode[], path: string): FileNode | null => {
    for (const file of files) {
      if (file.path === path) return file;
      if (file.children) {
        const found = findFileByPath(file.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const handleActionClick = (action: string, context?: string) => {
    switch (action) {
      case 'switch_to_generate':
        setActiveMode('generate');
        if (context) {
          // If there's context, also set it as the current message for generation
          setCurrentMessage(context);
        }
        break;
      case 'switch_to_test':
        setActiveMode('test');
        break;
      case 'switch_to_docs':
        setActiveMode('docs');
        break;
      case 'continue_discussion':
        if (context) {
          setCurrentMessage(context);
          // Auto-focus the input
          setTimeout(() => {
            const textarea = document.querySelector('textarea[placeholder*="Ask me anything"]') as HTMLTextAreaElement;
            if (textarea) {
              textarea.focus();
            }
          }, 100);
        }
        break;
      case 'create_hero_section':
        setActiveMode('generate');
        setCurrentMessage('Create a modern, responsive hero section with a compelling headline, engaging subheadline, and prominent call-to-action button. Use Tailwind CSS for styling and make it mobile-friendly.');
        break;
      case 'customize_design':
        setActiveMode('generate');
        setCurrentMessage('Help me customize the design of this project. I want to update the colors, fonts, and overall visual appearance to make it more modern and appealing.');
        break;
      case 'setup_product_catalog':
        setActiveMode('generate');
        setCurrentMessage('Create a product catalog system with product listings, images, descriptions, pricing, and basic filtering functionality.');
        break;
      case 'generate_code_auto':
        setActiveMode('generate');
        if (context) {
          setCurrentMessage(context);
        }
        break;
      default:
        console.log('Action not implemented:', action);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">Loading Repository...</h3>
          <p className="text-gray-500">Fetching {repoName} from GitHub</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">Failed to Load Repository</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={loadRepositoryContents}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <GitBranch className="h-5 w-5 text-blue-400" />
            <div>
              <h1 className="font-semibold text-white">{repoName}</h1>
              <p className="text-xs text-gray-400">{repoFullName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mode Tabs */}
          <button
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showCodeEditor
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
            title={showCodeEditor ? 'Hide Code Editor' : 'Show Code Editor'}
          >
            <Code className="h-4 w-4" />
            <span>{showCodeEditor ? 'Hide Code' : 'Show Code'}</span>
          </button>

          <button
            onClick={() => setShowAISettings(true)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>

          <a
            href={`https://github.com/${repoFullName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer Sidebar */}
        <div 
          className="bg-gray-800 border-r border-gray-700 flex flex-col"
          style={{ width: sidebarWidth }}
        >
          <FileExplorer
            files={files}
            selectedFile={selectedFile?.id}
            onFileSelect={handleFileSelect}
            onFolderExpand={handleFolderExpand}
            loadingFolders={loadingFolders}
            onFileCreate={handleFileCreate}
            onFileModify={handleFileModify}
          />
        </div>

        {/* Resize Handle */}
        <div
          ref={resizeRef}
          className="w-1 bg-gray-700 cursor-col-resize hover:bg-gray-600 transition-colors"
          onMouseDown={() => setIsResizing(true)}
        />

        {/* Code Editor Panel - Conditionally Rendered */}
        {showCodeEditor && (
          <div className="flex-1 flex flex-col bg-gray-900 border-r border-gray-700">
            {selectedFile ? (
              <CodeEditor
                initialCode={fileContent}
                language={selectedFile.language || 'text'}
                fileName={selectedFile.name}
                onCodeChange={(code) => setFileContent(code)}
                onSave={(code) => handleFileModify(selectedFile.path, code)}
                onRun={(code) => {
                  // Handle code execution if needed
                  console.log('Running code:', code);
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Code className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-400 mb-2">No File Selected</h3>
                  <p className="text-gray-500">Select a file from the explorer to view and edit its content</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Chat / Mode Panel - Expanded when code editor is hidden */}
        <div className={`${showCodeEditor ? 'w-[28rem]' : 'flex-1'} flex flex-col bg-gray-900`}>
          {activeMode === 'discuss' ? (
            /* Chat Interface */
            <div className="flex-1 flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 'calc(100vh - 180px)', maxHeight: 'calc(100vh - 180px)' }}>
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-400 mb-2">Start a Conversation</h3>
                    <p className="text-gray-500 text-sm">Ask me anything about your project!</p>
                  </div>
                ) : (
                  chatMessages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-full p-3 rounded-lg text-sm ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-800 text-gray-100 border border-gray-700'
                      }`}>
                        <div className="whitespace-pre-wrap break-words">{message.content}</div>
                        <div className="text-xs opacity-60 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                        
                        {/* Predictive Action Buttons */}
                        {message.role === 'assistant' && message.predictiveActions && message.predictiveActions.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-gray-600">
                            <div className="flex flex-wrap gap-1">
                              {message.predictiveActions.map((action) => (
                                <button
                                  key={action.id}
                                  onClick={() => handlePredictiveAction(action)}
                                  disabled={isImplementing}
                                  className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
                                >
                                  {action.icon}
                                  <span>{action.text}</span>
                                  {isImplementing && <RefreshCw className="h-2 w-2 animate-spin ml-1" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />
                        <span className="text-gray-300 text-sm">
                          {isImplementing ? 'Implementing changes...' : 'AI is thinking...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Smart Action Suggestions */}
              {chatMessages.length > 0 && !isProcessing && (
                <div className="px-4">
                  <SmartActionSuggestions
                    suggestions={generateSuggestions(
                      chatMessages[chatMessages.length - 2]?.content || '',
                      chatMessages[chatMessages.length - 1]?.content || '',
                      activeMode,
                      projectContext,
                      templateName
                    )}
                    onActionClick={handleActionClick}
                    className="text-xs"
                  />
                </div>
              )}

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex space-x-2">
                  <textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm leading-relaxed"
                    rows={3}
                    disabled={isProcessing}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || isProcessing}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors self-end"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : activeMode === 'generate' ? (
            <CodeGenerationMode
              files={files.map(f => ({ name: f.name, type: f.type, path: f.path, content: f.content }))}
              repository={{ name: repoName, description: repoDescription, fullName: repoFullName }}
              selectedFile={selectedFile ? {
                name: selectedFile.name,
                path: selectedFile.path,
                content: fileContent,
                language: selectedFile.language || 'text'
              } : undefined}
              onFileCreate={handleFileCreate}
              onFileModify={handleFileModify}
              projectContext={projectContext}
              templateName={templateName}
              conversationHistory={chatMessages}
            />
          ) : activeMode === 'test' ? (
            <TestMode
              files={files.map(f => ({ name: f.name, type: f.type, path: f.path, content: f.content }))}
              repository={{ name: repoName, description: repoDescription, fullName: repoFullName }}
              onInstallDependencies={onInstallDependencies}
            />
          ) : activeMode === 'docs' ? (
            <DocumentationMode
              files={files.map(f => ({ name: f.name, type: f.type, path: f.path, content: f.content }))}
              repository={{ name: repoName, description: repoDescription, fullName: repoFullName }}
              onFileCreate={handleFileCreate}
              onFileModify={handleFileModify}
              selectedFile={selectedFile ? {
                name: selectedFile.name,
                path: selectedFile.path,
                content: fileContent,
                language: selectedFile.language || 'text'
              } : undefined}
            />
          ) : null}
        </div>
      </div>

      {/* Terminal */}
      {showTerminal && (
        <Terminal
          onCommand={async (command) => {
            // Handle terminal commands
            return `Command executed: ${command}`;
          }}
        />
      )}

      {/* AI Settings Modal */}
      {showAISettings && (
        <AISettingsModal
          isOpen={showAISettings}
          onClose={() => setShowAISettings(false)}
          onSave={(settings) => {
            openRouterAI.updateSettings(settings);
            showSuccess('Settings saved', 'AI settings have been updated');
          }}
          currentSettings={openRouterAI.getSettings()}
        />
      )}

      {/* Notifications */}
      <NotificationSystem
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}