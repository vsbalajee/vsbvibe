import { useState, useEffect } from 'react';
import { X, Settings, Save, RotateCcw, Eye, EyeOff, Info } from 'lucide-react';

interface AISettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AISettings) => void;
  currentSettings: AISettings;
}

export function AISettingsModal({ isOpen, onClose, onSave, currentSettings }: AISettingsModalProps) {
  const [settings, setSettings] = useState<AISettings>(currentSettings);
  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState<Partial<AISettings>>({});

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const validateSettings = (): boolean => {
    const newErrors: Partial<AISettings> = {};

    if (!settings.apiKey.trim()) {
      newErrors.apiKey = 'API Key is required';
    }

    if (!settings.baseUrl.trim()) {
      newErrors.baseUrl = 'Base URL is required';
    } else if (!settings.baseUrl.startsWith('http')) {
      newErrors.baseUrl = 'Base URL must start with http:// or https://';
    }

    if (!settings.model.trim()) {
      newErrors.model = 'Model name is required';
    }

    if (settings.temperature < 0 || settings.temperature > 2) {
      newErrors.temperature = 'Temperature must be between 0 and 2';
    }

    if (settings.maxTokens < 1 || settings.maxTokens > 32000) {
      newErrors.maxTokens = 'Max tokens must be between 1 and 32000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateSettings()) {
      onSave(settings);
      onClose();
    }
  };

  const handleReset = () => {
    const defaultSettings: AISettings = {
      apiKey: '',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'qwen/qwen-2.5-72b-instruct',
      temperature: 0.7,
      maxTokens: 4000
    };
    setSettings(defaultSettings);
    setErrors({});
  };

  const popularModels = [
    'qwen/qwen-2.5-72b-instruct',
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'meta-llama/llama-3.1-70b-instruct',
    'google/gemini-pro-1.5',
    'mistralai/mistral-large'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">AI Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key *
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                  errors.apiKey ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter your OpenRouter API key"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.apiKey && (
              <p className="text-red-400 text-sm mt-1">{errors.apiKey}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">OpenRouter.ai</a>
            </p>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Base URL *
            </label>
            <input
              type="text"
              value={settings.baseUrl}
              onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
              className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.baseUrl ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="https://openrouter.ai/api/v1"
            />
            {errors.baseUrl && (
              <p className="text-red-400 text-sm mt-1">{errors.baseUrl}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              The base URL for the AI API endpoint
            </p>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Model *
            </label>
            <div className="space-y-2">
              <select
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.model ? 'border-red-500' : 'border-gray-600'
                }`}
              >
                <option value="">Select a model</option>
                {popularModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
                <option value="custom">Custom model...</option>
              </select>
              
              {(settings.model === 'custom' || !popularModels.includes(settings.model)) && settings.model !== '' && (
                <input
                  type="text"
                  value={settings.model === 'custom' ? '' : settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter custom model name"
                  autoFocus
                />
              )}
            </div>
            {errors.model && (
              <p className="text-red-400 text-sm mt-1">{errors.model}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              The AI model to use for code generation and chat
            </p>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Temperature: {settings.temperature}
            </label>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-500">Focused</span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-xs text-gray-500">Creative</span>
            </div>
            {errors.temperature && (
              <p className="text-red-400 text-sm mt-1">{errors.temperature}</p>
            )}
            <div className="flex items-start space-x-2 mt-2">
              <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-gray-500 text-xs">
                Controls randomness: 0.0 = deterministic and focused, 2.0 = very creative and varied
              </p>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Tokens
            </label>
            <input
              type="number"
              min="1"
              max="32000"
              value={settings.maxTokens}
              onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) || 4000 })}
              className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.maxTokens ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="4000"
            />
            {errors.maxTokens && (
              <p className="text-red-400 text-sm mt-1">{errors.maxTokens}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Maximum number of tokens in the AI response (affects cost and response length)
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset to Defaults</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}