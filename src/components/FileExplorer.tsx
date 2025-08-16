import { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  File, 
  Plus, 
  MoreHorizontal, 
  Edit3, 
  Trash2,
  Download,
  Upload
} from 'lucide-react';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  content?: string;
  language?: string;
}

interface FileExplorerProps {
  files: FileNode[];
  selectedFile?: string;
  onFileSelect?: (file: FileNode) => void;
  onFolderExpand?: (folder: FileNode) => void;
  loadingFolders?: Set<string>;
  onFileCreate?: (parentPath: string, name: string, type: 'file' | 'folder') => void;
  onFileDelete?: (file: FileNode) => void;
  onFileRename?: (file: FileNode, newName: string) => void;
}

export function FileExplorer({
  files,
  selectedFile,
  onFileSelect,
  onFolderExpand,
  loadingFolders = new Set(),
  onFileCreate,
  onFileDelete,
  onFileRename
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileNode } | null>(null);
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileNode) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const handleRename = (file: FileNode) => {
    setRenamingFile(file.id);
    setNewFileName(file.name);
    setContextMenu(null);
  };

  const confirmRename = (file: FileNode) => {
    if (newFileName.trim() && newFileName !== file.name) {
      onFileRename?.(file, newFileName.trim());
    }
    setRenamingFile(null);
    setNewFileName('');
  };

  const getFileIcon = (file: FileNode) => {
    if (file.type === 'folder') {
      if (loadingFolders.has(file.path)) {
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />;
      }
      return expandedFolders.has(file.id) ? 
        <FolderOpen className="h-4 w-4 text-blue-400" /> : 
        <Folder className="h-4 w-4 text-blue-400" />;
    }

    // File type icons based on extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    const iconClass = "h-4 w-4";
    
    switch (ext) {
      case 'js':
      case 'jsx':
        return <File className={`${iconClass} text-yellow-400`} />;
      case 'ts':
      case 'tsx':
        return <File className={`${iconClass} text-blue-400`} />;
      case 'py':
        return <File className={`${iconClass} text-green-400`} />;
      case 'html':
        return <File className={`${iconClass} text-orange-400`} />;
      case 'css':
        return <File className={`${iconClass} text-pink-400`} />;
      case 'json':
        return <File className={`${iconClass} text-purple-400`} />;
      case 'md':
        return <File className={`${iconClass} text-gray-300`} />;
      default:
        return <File className={`${iconClass} text-gray-400`} />;
    }
  };

  const renderFileNode = (file: FileNode, depth: number = 0) => {
    const isSelected = selectedFile === file.id;
    const isExpanded = expandedFolders.has(file.id);
    const isRenaming = renamingFile === file.id;

    return (
      <div key={file.id}>
        <div
          className={`flex items-center space-x-2 px-2 py-1 cursor-pointer hover:bg-gray-700 ${
            isSelected ? 'bg-blue-600/20 border-r-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (file.type === 'folder') {
              toggleFolder(file.id);
              onFolderExpand?.(file);
            } else {
              onFileSelect?.(file);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, file)}
        >
          {getFileIcon(file)}
          
          {isRenaming ? (
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => confirmRename(file)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmRename(file);
                } else if (e.key === 'Escape') {
                  setRenamingFile(null);
                  setNewFileName('');
                }
              }}
              className="flex-1 bg-gray-800 text-white text-sm px-1 py-0 border border-blue-500 rounded focus:outline-none"
              autoFocus
            />
          ) : (
            <span className={`text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>
              {file.name}
            </span>
          )}
        </div>

        {file.type === 'folder' && isExpanded && file.children && (
          <div>
            {file.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-800 border-r border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-300">Explorer</h3>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onFileCreate?.('', 'new-file.js', 'file')}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            title="New File"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            onClick={() => onFileCreate?.('', 'new-folder', 'folder')}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
            title="New Folder"
          >
            <Folder className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {files.map(file => renderFileNode(file))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg py-1 min-w-[150px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => handleRename(contextMenu.file)}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
            >
              <Edit3 className="h-3 w-3" />
              <span>Rename</span>
            </button>
            <button
              onClick={() => {
                onFileDelete?.(contextMenu.file);
                setContextMenu(null);
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}