import { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, X, Minus, Square } from 'lucide-react';

interface TerminalProps {
  onCommand?: (command: string) => Promise<string>;
  initialOutput?: string[];
}

export function Terminal({ onCommand, initialOutput = [] }: TerminalProps) {
  const [output, setOutput] = useState<string[]>(initialOutput);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMinimized, setIsMinimized] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new output is added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    // Focus input when terminal is opened
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  const addOutput = (text: string) => {
    setOutput(prev => [...prev, text]);
  };

  const handleCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to output
    addOutput(`$ ${command}`);

    // Add to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Handle built-in commands
    if (command === 'clear') {
      setOutput([]);
      setCurrentCommand('');
      return;
    }

    if (command === 'help') {
      addOutput('Available commands:');
      addOutput('  clear    - Clear the terminal');
      addOutput('  help     - Show this help message');
      addOutput('  ls       - List files');
      addOutput('  pwd      - Show current directory');
      addOutput('  echo     - Echo text');
      setCurrentCommand('');
      return;
    }

    if (command.startsWith('echo ')) {
      addOutput(command.substring(5));
      setCurrentCommand('');
      return;
    }

    if (command === 'pwd') {
      addOutput('/workspace');
      setCurrentCommand('');
      return;
    }

    if (command === 'ls') {
      addOutput('src/  public/  package.json  README.md');
      setCurrentCommand('');
      return;
    }

    // Handle custom commands via prop
    if (onCommand) {
      try {
        const result = await onCommand(command);
        addOutput(result);
      } catch (error) {
        addOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      addOutput(`Command not found: ${command}`);
    }

    setCurrentCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(currentCommand);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion for common commands
      const commands = ['clear', 'help', 'ls', 'pwd', 'echo'];
      const matches = commands.filter(cmd => cmd.startsWith(currentCommand));
      if (matches.length === 1) {
        setCurrentCommand(matches[0]);
      }
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-800 text-gray-300 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors"
        >
          <TerminalIcon className="h-4 w-4" />
          <span>Terminal</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-64 bg-gray-900 border border-gray-600 rounded-lg shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-600 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-300">Terminal</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          >
            <Minus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 p-3 overflow-y-auto font-mono text-sm text-gray-100 bg-gray-900"
      >
        {output.map((line, index) => (
          <div key={index} className="whitespace-pre-wrap">
            {line}
          </div>
        ))}
        
        {/* Current Input Line */}
        <div className="flex items-center">
          <span className="text-green-400 mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-gray-100 outline-none"
            placeholder="Type a command..."
          />
        </div>
      </div>
    </div>
  );
}