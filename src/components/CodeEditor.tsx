import { useState, useEffect } from 'react';
import { Play, Save, Download, Settings, Maximize2, Minimize2 } from 'lucide-react';

interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  fileName?: string;
  onCodeChange?: (code: string) => void;
  onSave?: (code: string) => void;
  onRun?: (code: string) => void;
}

export function CodeEditor({
  initialCode = '',
  language = 'javascript',
  fileName = 'untitled.js',
  onCodeChange,
  onSave,
  onRun
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    onCodeChange?.(newCode);
  };

  const handleSave = () => {
    onSave?.(code);
  };

  const handleRun = () => {
    onRun?.(code);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Ctrl+S for save
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    
    // Handle Ctrl+Enter for run
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }

    // Handle Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const getLanguageColor = (lang: string) => {
    const colors: { [key: string]: string } = {
      javascript: 'text-yellow-400',
      typescript: 'text-blue-400',
      python: 'text-green-400',
      html: 'text-orange-400',
      css: 'text-pink-400',
      json: 'text-purple-400',
    };
    return colors[lang] || 'text-gray-400';
  };

  return (
    <div className={`flex flex-col bg-gray-900 border border-gray-700 rounded-lg overflow-hidden ${
      isFullscreen ? 'fixed inset-0 z-50' : 'h-full'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <span className="text-gray-300 font-medium">{fileName}</span>
          <span className={`text-xs px-2 py-1 rounded ${getLanguageColor(language)} bg-gray-700`}>
            {language}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRun}
            className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
            title="Run Code (Ctrl+Enter)"
          >
            <Play className="h-3 w-3" />
            <span>Run</span>
          </button>
          
          <button
            onClick={handleSave}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
            title="Save (Ctrl+S)"
          >
            <Save className="h-3 w-3" />
            <span>Save</span>
          </button>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setFontSize(Math.max(10, fontSize - 1))}
              className="px-2 py-1 text-gray-400 hover:text-white text-xs"
            >
              A-
            </button>
            <span className="text-xs text-gray-500">{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(24, fontSize + 1))}
              className="px-2 py-1 text-gray-400 hover:text-white text-xs"
            >
              A+
            </button>
          </div>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <textarea
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-4 bg-gray-900 text-gray-100 font-mono resize-none focus:outline-none"
          style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}
          placeholder="Start coding..."
          spellCheck={false}
        />
        
        {/* Line numbers (simplified) */}
        <div className="absolute left-0 top-0 p-4 text-gray-500 font-mono pointer-events-none select-none" style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}>
          {code.split('\n').map((_, index) => (
            <div key={index} className="text-right pr-2" style={{ minWidth: '2em' }}>
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Lines: {code.split('\n').length}</span>
          <span>Characters: {code.length}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>UTF-8</span>
          <span className="capitalize">{language}</span>
        </div>
      </div>
    </div>
  );
}