import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X, Upload, Download, FileText, Code, GitBranch } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  persistent?: boolean;
  icon?: React.ReactNode;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export function NotificationSystem({ notifications, onDismiss }: NotificationSystemProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setVisibleNotifications(notifications);

    // Auto-dismiss non-persistent notifications
    notifications.forEach(notification => {
      if (!notification.persistent) {
        const duration = notification.duration || 5000;
        setTimeout(() => {
          onDismiss(notification.id);
        }, duration);
      }
    });
  }, [notifications, onDismiss]);

  const getIcon = (notification: Notification) => {
    if (notification.icon) return notification.icon;
    
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20';
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'info':
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border backdrop-blur-sm shadow-lg transform transition-all duration-300 ease-in-out ${getBackgroundColor(notification.type)}`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getIcon(notification)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-300">
                {notification.message}
              </p>
              
              {notification.action && (
                <button
                  onClick={notification.action.onClick}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  {notification.action.label}
                </button>
              )}
            </div>
            
            <button
              onClick={() => onDismiss(notification.id)}
              className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    return id;
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Convenience methods for different notification types
  const showSuccess = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'success', title, message, ...options });
  };

  const showError = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'error', title, message, persistent: true, ...options });
  };

  const showWarning = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'warning', title, message, ...options });
  };

  const showInfo = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'info', title, message, ...options });
  };

  // Specialized notifications for file operations
  const showFileCreated = (fileName: string, options?: Partial<Notification>) => {
    return showSuccess(
      'File Created',
      `Successfully created ${fileName}`,
      {
        icon: <FileText className="h-5 w-5 text-green-400" />,
        ...options
      }
    );
  };

  const showFileModified = (fileName: string, options?: Partial<Notification>) => {
    return showSuccess(
      'File Modified',
      `Successfully updated ${fileName}`,
      {
        icon: <Code className="h-5 w-5 text-green-400" />,
        ...options
      }
    );
  };

  const showGitCommit = (fileName: string, commitUrl?: string, options?: Partial<Notification>) => {
    return showSuccess(
      'Committed to GitHub',
      `${fileName} has been pushed to your repository`,
      {
        icon: <GitBranch className="h-5 w-5 text-green-400" />,
        action: commitUrl ? {
          label: 'View Commit',
          onClick: () => window.open(commitUrl, '_blank')
        } : undefined,
        ...options
      }
    );
  };

  const showUploadProgress = (fileName: string, options?: Partial<Notification>) => {
    return showInfo(
      'Uploading to GitHub',
      `Pushing ${fileName} to your repository...`,
      {
        icon: <Upload className="h-5 w-5 text-blue-400 animate-pulse" />,
        persistent: true,
        ...options
      }
    );
  };

  const showAIProcessing = (action: string, options?: Partial<Notification>) => {
    return showInfo(
      'AI Processing',
      `${action}...`,
      {
        icon: <div className="h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />,
        persistent: true,
        ...options
      }
    );
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showFileCreated,
    showFileModified,
    showGitCommit,
    showUploadProgress,
    showAIProcessing
  };
}