import { useState, useEffect } from 'react';
import { 
  FileText, 
  BookOpen, 
  Code, 
  MessageSquare, 
  Settings, 
  Download, 
  Copy,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  FileCode,
  Globe,
  Component,
  Database
} from 'lucide-react';
import { openRouterAI } from '../lib/ai';
import { projectAnalyzer } from '../lib/projectAnalyzer';

interface DocumentationFile {
  path: string;
  content: string;
  operation: 'create' | 'modify' | 'patch';
  language?: string;
  documentationType: string;
  description: string;
}

interface DocumentationModeProps {
  files: Array<{ name: string; type: string; path: string; content?: string }>;
  repository?: { name: string; description: string; fullName: string };
  onFileCreate?: (path: string, content: string) => void;
  onFileModify?: (path: string, content: string) => void;
  selectedFile?: { name: string; path: string; content: string; language: string };
}

export function DocumentationMode({ 
  files, 
  repository, 
  onFileCreate, 
  onFileModify,
  selectedFile 
}: DocumentationModeProps) {
  const [documentationType, setDocumentationType] = useState<'inline' | 'function' | 'readme' | 'project_overview' | 'api' | 'component'>('readme');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<DocumentationFile[]>([]);
  const [suggestion, setSuggestion] = useState('');
  const [projectContext, setProjectContext] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Documentation templates
  const templates = {
    readme: 'Generate a comprehensive README.md file for this project',
    function: 'Add JSDoc comments to all functions in the current file',
    inline: 'Add inline comments explaining complex logic in the current file',
    component: 'Document React/Vue components with props, usage examples, and descriptions',
    component: 'Generate React components with props, usage examples, and descriptions',
    api: 'Generate API documentation for endpoints and data models',
    project_overview: 'Create high-level project documentation including architecture and setup'
  };

  useEffect(() => {
    // Analyze project context on mount
    analyzeProjectContext();
  }, [files]);

  const analyzeProjectContext = async () => {
    try {
      const context = await projectAnalyzer.analyzeProject(files, repository);
      setProjectContext(context);
    } catch (error) {
      console.error('Error analyzing project context:', error);
    }
  };

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
    setCustomPrompt(templates[template as keyof typeof templates] || '');
  };

  const generateDocumentation = async () => {
    if (!customPrompt.trim()) return;

    setIsGenerating(true);
    setGeneratedDocs([]);
    setSuggestion('');

    try {
      const result = await openRouterAI.generateDocumentation(
        customPrompt,
        {
          documentationType,
          currentFile: selectedFile,
          projectStructure: files,
          repository,
          projectContext
        }
      );

      setSuggestion(result.suggestion);
      setGeneratedDocs(result.files);
    } catch (error) {
      console.error('Error generating documentation:', error);
      setSuggestion('Failed to generate documentation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const commitDocumentation = async (doc: DocumentationFile) => {
    console.log('🚀 Applying documentation:', doc.path, doc.operation);
    
    try {
      // Show loading state
      const button = document.activeElement as HTMLButtonElement;
      const originalText = button?.textContent || '';
      if (button) {
        button.disabled = true;
        button.textContent = '🔄 Committing...';
      }

      if (doc.operation === 'create') {
        onFileCreate?.(doc.path, doc.content);
        console.log(`📝 Committed documentation: Created ${doc.path}`);
      } else {
        onFileModify?.(doc.path, doc.content);
        console.log(`📝 Committed documentation: Modified ${doc.path}`);
      }
      
      // Show success feedback
      if (button) {
        button.textContent = '✅ Committed!';
        button.style.backgroundColor = '#10b981';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
          button.disabled = false;
        }, 2000);
      }
      
    } catch (error) {
      console.error('❌ Error committing documentation:', error);
      
      // Show error feedback
      const button = document.activeElement as HTMLButtonElement;
      if (button) {
        button.textContent = '❌ Failed';
        button.style.backgroundColor = '#ef4444';
        setTimeout(() => {
          button.textContent = 'Commit';
          button.style.backgroundColor = '';
          button.disabled = false;
        }, 2000);
      }
    }
  };

  const commitAllDocumentation = async () => {
    const button = document.activeElement as HTMLButtonElement;
    const originalText = button?.textContent || '';
    const totalFiles = generatedDocs.length;
    
    try {
      // Show loading state
      if (button) {
        button.disabled = true;
        button.textContent = `🔄 Committing ${totalFiles} files...`;
      }
      
      // Commit all files
      for (let i = 0; i < generatedDocs.length; i++) {
        const doc = generatedDocs[i];
        if (doc.operation === 'create') {
          onFileCreate?.(doc.path, doc.content);
        } else {
          onFileModify?.(doc.path, doc.content);
        }
        
        // Update progress
        if (button) {
          button.textContent = `🔄 Committing ${i + 1}/${totalFiles}...`;
        }
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Clear the generated docs after successful commit
      setGeneratedDocs([]);
      setSuggestion('');
      
      // Show success feedback
      if (button) {
        button.textContent = `✅ Committed All ${totalFiles} Files!`;
        button.style.backgroundColor = '#10b981';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
          button.disabled = false;
        }, 3000);
      }
      
    } catch (error) {
      console.error('❌ Error committing all documentation:', error);
      
      // Show error feedback
      if (button) {
        button.textContent = '❌ Commit Failed';
        button.style.backgroundColor = '#ef4444';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
          button.disabled = false;
        }, 3000);
      }
    }
  };

  const copyToClipboard = async (content: string, filename: string) => {
    try {
      await navigator.clipboard.writeText(content);
      console.log(`✅ Copied ${filename} to clipboard`);
      
      // Show visual feedback
      const button = document.activeElement as HTMLButtonElement;
      const originalText = button?.textContent || '';
      if (button && button.textContent?.includes('Copy')) {
        button.textContent = '✅ Copied!';
        button.style.backgroundColor = '#10b981';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      
      // Show error feedback
      const button = document.activeElement as HTMLButtonElement;
      if (button && button.textContent?.includes('Copy')) {
        const originalText = button.textContent;
        button.textContent = '❌ Failed';
        button.style.backgroundColor = '#ef4444';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
        }, 2000);
      }
      
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        console.log(`✅ Copied ${filename} to clipboard (fallback)`);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  const downloadFile = (content: string, filepath: string) => {
    try {
      // Extract filename from path
      const filename = filepath.split('/').pop() || 'document.txt';
      
      // Show visual feedback
      const button = document.activeElement as HTMLButtonElement;
      const originalText = button?.textContent || '';
      if (button && button.textContent?.includes('Download')) {
        button.disabled = true;
        button.textContent = '⬇️ Downloading...';
      }
      
      // Create blob and download
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      console.log(`✅ Downloaded ${filename}`);
      
      // Show success feedback
      if (button && button.textContent?.includes('Downloading')) {
        button.textContent = '✅ Downloaded!';
        button.style.backgroundColor = '#10b981';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
          button.disabled = false;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to download file:', error);
      
      // Show error feedback
      const button = document.activeElement as HTMLButtonElement;
      if (button && button.textContent?.includes('Download')) {
        const originalText = button.textContent;
        button.textContent = '❌ Failed';
        button.style.backgroundColor = '#ef4444';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
          button.disabled = false;
        }, 2000);
      }
    }
  };
  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case 'readme': return <FileText className="h-4 w-4 text-blue-400" />;
      case 'function': return <Code className="h-4 w-4 text-green-400" />;
      case 'inline': return <MessageSquare className="h-4 w-4 text-yellow-400" />;
      case 'component': return <Component className="h-4 w-4 text-purple-400" />;
      case 'api': return <Database className="h-4 w-4 text-red-400" />;
      case 'project_overview': return <Globe className="h-4 w-4 text-indigo-400" />;
      default: return <FileCode className="h-4 w-4 text-gray-400" />;
    }
  };

  const getLanguageColor = (language?: string) => {
    switch (language) {
      case 'markdown': return 'text-blue-400';
      case 'javascript': return 'text-yellow-400';
      case 'typescript': return 'text-blue-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Documentation Generator</h2>
        </div>
        
        {projectContext && (
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-gray-400" />
              <span className="text-gray-300">{projectContext.primaryFramework}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileCode className="h-4 w-4 text-gray-400" />
              <span className="text-gray-300">{projectContext.typeScriptUsage}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Configuration Panel */}
        <div className="w-80 border-r border-gray-700 flex flex-col">
          <div className="p-4 space-y-4">
            {/* Documentation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Documentation Type
              </label>
              <select
                value={documentationType}
                onChange={(e) => setDocumentationType(e.target.value as any)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="readme">README File</option>
                <option value="function">Function Documentation</option>
                <option value="inline">Inline Comments</option>
                <option value="component">Component Documentation</option>
                <option value="api">API Documentation</option>
                <option value="project_overview">Project Overview</option>
              </select>
            </div>

            {/* Quick Templates */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quick Templates
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(templates).map(([key, description]) => (
                  <button
                    key={key}
                    onClick={() => handleTemplateSelect(key)}
                    className={`p-2 text-xs rounded-lg border transition-colors ${
                      selectedTemplate === key
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1 mb-1">
                      {getDocTypeIcon(key)}
                      <span className="capitalize">{key.replace('_', ' ')}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Current File Context */}
            {selectedFile && (
              <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
                  <FileCode className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Current File</span>
                </div>
                <p className="text-xs text-gray-300 truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-400 truncate">{selectedFile.path}</p>
                <span className={`text-xs ${getLanguageColor(selectedFile.language)}`}>
                  {selectedFile.language}
                </span>
              </div>
            )}

            {/* Custom Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Documentation Request
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe what documentation you want to generate..."
                className="w-full h-32 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={generateDocumentation}
              disabled={!customPrompt.trim() || isGenerating}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>
                {isGenerating ? 'Generating...' : 'Generate Documentation'}
              </span>
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="flex-1 flex flex-col">
          {suggestion && (
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-start space-x-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Lightbulb className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-white mb-1">Documentation Plan</h3>
                  <p className="text-sm text-blue-300">{suggestion}</p>
                </div>
              </div>
            </div>
          )}

          {generatedDocs.length > 0 && (
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">Generated Documentation ({generatedDocs.length})</h3>
                <button
                  onClick={commitAllDocumentation}
                  className="flex items-center space-x-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                >
                  <CheckCircle className="h-3 w-3" />
                  <span>Commit All</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {generatedDocs.length > 0 ? (
              <div className="p-4 space-y-4">
                {generatedDocs.map((doc, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg border border-gray-700">
                    {/* File Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-700">
                      <div className="flex items-center space-x-3">
                        {getDocTypeIcon(doc.documentationType)}
                        <div>
                          <h4 className="font-medium text-white">{doc.path}</h4>
                          <p className="text-sm text-gray-400">{doc.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-1 rounded ${
                          doc.operation === 'create' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {doc.operation.toUpperCase()}
                        </span>
                        
                        {/* Action Buttons - Always Show for All Documentation Types */}
                        <button
                          onClick={() => copyToClipboard(doc.content, doc.path)}
                          className="flex items-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </button>
                        
                        <button
                          onClick={() => downloadFile(doc.content, doc.path)}
                          className="flex items-center space-x-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                          title="Download file"
                        >
                          <Download className="h-3 w-3" />
                          <span>Download</span>
                        </button>
                        
                        <button
                          onClick={() => commitDocumentation(doc)}
                          className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                          title="Commit to repository"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Commit</span>
                        </button>
                      </div>
                    </div>

                    {/* File Content Preview */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-400">Generated Content:</span>
                        <div className="text-xs text-gray-500">
                          Lines: {doc.content.split('\n').length} | Characters: {doc.content.length}
                        </div>
                      </div>
                      
                      <div className="bg-gray-900 border border-gray-600 rounded p-3 text-sm text-gray-300 overflow-auto max-h-64">
                        <pre className="whitespace-pre-wrap break-words">
                        <code>{doc.content}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !isGenerating ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-400 mb-2">No Documentation Generated</h3>
                  <p className="text-gray-500">Select a documentation type and enter a request to get started</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">Generating Documentation...</h3>
                  <p className="text-gray-500">The AI is creating comprehensive documentation for your project</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}