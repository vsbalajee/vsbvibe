import { useState, useEffect } from 'react';
import {
  TestTube, 
  Play, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  FileText,
  Settings,
  Filter,
  ChevronDown,
  FileJson,
  FileType
} from 'lucide-react';
import { openRouterAI } from '../lib/ai';

interface TestResult {
  fileName: string;
  language: string;
  qualityScore: number;
  maintainabilityScore: number;
  performanceScore: number;
  issues: Array<{
    type: 'error' | 'warning' | 'suggestion';
    line?: number;
    message: string;
    severity: 'high' | 'medium' | 'low';
    fix_suggestion?: string;
  }>;
  strengths: string[];
  improvements: string[];
  security_concerns: string[];
  performance_notes: string[];
}

interface TestModeProps {
  files: Array<{ name: string; type: string; path: string; content?: string }>;
  repository?: { name: string; description: string; fullName: string };
  onInstallDependencies?: (dependencies: string[]) => Promise<void>;
}

interface FileItem {
  name: string;
  path: string;
  content?: string;
  language: string;
}

export function TestMode({ files, repository, onInstallDependencies }: TestModeProps) {
  // Hoist isCodeFile function before usage to avoid temporal dead zone error
  const isCodeFile = (path: string): boolean => {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.html', '.css', '.scss', '.json', '.md', '.yml', '.yaml', '.xml'];
    return codeExtensions.some(ext => path.toLowerCase().endsWith(ext));
  };

  const [codeFiles, setCodeFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [analysisTypes, setAnalysisTypes] = useState({
    codeQuality: true,
    performance: true,
    security: true,
    maintainability: true,
    accessibility: false,
    bestPractices: false
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [filter, setFilter] = useState<'all' | 'errors' | 'warnings' | 'suggestions'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [analysisDepth, setAnalysisDepth] = useState<'standard' | 'deep'>('standard');
  const [batchSize, setBatchSize] = useState(3);
  const [includeFix, setIncludeFix] = useState(true);

  // Process files and extract code files
  useEffect(() => {
    const processFiles = () => {
      console.log('Processing files for TestMode:', files.length);
      
      const processedCodeFiles: FileItem[] = files
        .filter(f => {
          const isFile = f.type === 'file';
          const hasValidPath = f.path && isCodeFile(f.path);
          return isFile && hasValidPath;
        })
        .map(f => ({
          name: f.name,
          path: f.path,
          content: f.content || '',
          language: getLanguageFromPath(f.path)
        }));
      
      setCodeFiles(processedCodeFiles);
      setLoading(false);
    };

    processFiles();
  }, [files]);

  useEffect(() => {
    // Auto-select all code files initially when codeFiles changes
    if (codeFiles.length > 0) {
      // Auto-select all files initially
    }
    setSelectedFiles(codeFiles.map(f => f.path));
  }, [codeFiles]);

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
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
    return langMap[ext] || 'text';
  };

  const handleFileToggle = (filePath: string) => {
    setSelectedFiles(prev => 
      prev.includes(filePath) 
        ? prev.filter(f => f !== filePath)
        : [...prev, filePath]
    );
  };

  const handleSelectAll = () => {
    setSelectedFiles(codeFiles.map(f => f.path));
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
  };

  const handleAnalysisTypeToggle = (type: keyof typeof analysisTypes) => {
    setAnalysisTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSelectAllAnalysis = () => {
    setAnalysisTypes({
      codeQuality: true,
      performance: true,
      security: true,
      maintainability: true,
      accessibility: true,
      bestPractices: true
    });
  };

  const handleClearAllAnalysis = () => {
    setAnalysisTypes({
      codeQuality: false,
      performance: false,
      security: false,
      maintainability: false,
      accessibility: false,
      bestPractices: false
    });
  };

  const runAnalysis = async () => {
    if (selectedFiles.length === 0) return;

    setIsAnalyzing(true);
    setResults([]);

    try {
      const selectedFileObjects = codeFiles.filter(f => selectedFiles.includes(f.path));
      const newResults: TestResult[] = [];

      // Process files in batches
      for (let i = 0; i < selectedFileObjects.length; i += batchSize) {
        const batch = selectedFileObjects.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (file) => {
          try {
            const codeReview = await openRouterAI.performCodeReview(
              file.content || '',
              file.name,
              getLanguageFromPath(file.path)
            );

            const performanceAnalysis = await openRouterAI.analyzePerformance(
              file.content || '',
              file.name,
              getLanguageFromPath(file.path)
            );

            return {
              fileName: file.name,
              language: getLanguageFromPath(file.path),
              qualityScore: codeReview.overall_score,
              maintainabilityScore: Math.round((codeReview.overall_score + performanceAnalysis.performance_score) / 2),
              performanceScore: performanceAnalysis.performance_score,
              issues: codeReview.issues,
              strengths: codeReview.strengths,
              improvements: codeReview.improvements,
              security_concerns: codeReview.security_concerns,
              performance_notes: performanceAnalysis.best_practices
            };
          } catch (error) {
            console.error('Error analyzing file:', file.name, error);
            return {
              fileName: file.name,
              language: getLanguageFromPath(file.path),
              qualityScore: 0,
              maintainabilityScore: 0,
              performanceScore: 0,
              issues: [{
                type: 'error',
                message: `Failed to analyze: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: 'high'
              }],
              strengths: [],
              improvements: [],
              security_concerns: [],
              performance_notes: []
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        newResults.push(...batchResults);
      }

      setResults(newResults);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportAsJSON = () => {
    const exportData = {
      repository: repository?.name || 'Unknown',
      analysisDate: new Date().toISOString(),
      totalFiles: results.length,
      averageQualityScore: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length) : 0,
      results: results
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code_analysis_${repository?.name || 'project'}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportOptions(false);
  };

  const handleExportAsWord = () => {
    const averageQualityScore = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length) : 0;
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const highSeverityIssues = results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'high').length, 0);
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Code Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e40af; margin-top: 30px; }
        h3 { color: #1e3a8a; margin-top: 20px; }
        .summary { background-color: #f8fafc; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0; }
        .file-section { margin: 30px 0; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; }
        .score { font-weight: bold; font-size: 18px; }
        .score.excellent { color: #059669; }
        .score.good { color: #0891b2; }
        .score.fair { color: #d97706; }
        .score.poor { color: #dc2626; }
        .issue { margin: 10px 0; padding: 10px; border-radius: 4px; }
        .issue.error { background-color: #fef2f2; border-left: 4px solid #dc2626; }
        .issue.warning { background-color: #fffbeb; border-left: 4px solid #d97706; }
        .issue.suggestion { background-color: #f0f9ff; border-left: 4px solid #0891b2; }
        .severity { font-weight: bold; text-transform: uppercase; font-size: 12px; }
        .severity.high { color: #dc2626; }
        .severity.medium { color: #d97706; }
        .severity.low { color: #059669; }
        ul { margin: 10px 0; }
        li { margin: 5px 0; }
        .metadata { color: #64748b; font-size: 14px; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background-color: #f8fafc; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Code Review & Quality Analysis Report</h1>
    
    <div class="metadata">
        <p><strong>Project:</strong> ${repository?.name || 'Unknown Project'}</p>
        <p><strong>Analysis Date:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
        <p><strong>Total Files Analyzed:</strong> ${results.length}</p>
    </div>

    <div class="summary">
        <h2>Executive Summary</h2>
        <table>
            <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Status</th>
            </tr>
            <tr>
                <td>Average Quality Score</td>
                <td class="score ${averageQualityScore >= 85 ? 'excellent' : averageQualityScore >= 70 ? 'good' : averageQualityScore >= 50 ? 'fair' : 'poor'}">${averageQualityScore}/100</td>
                <td>${averageQualityScore >= 85 ? 'Excellent' : averageQualityScore >= 70 ? 'Good' : averageQualityScore >= 50 ? 'Fair' : 'Needs Improvement'}</td>
            </tr>
            <tr>
                <td>Total Issues Found</td>
                <td>${totalIssues}</td>
                <td>${totalIssues === 0 ? 'Perfect' : totalIssues < 5 ? 'Good' : totalIssues < 15 ? 'Fair' : 'High'}</td>
            </tr>
            <tr>
                <td>High Severity Issues</td>
                <td>${highSeverityIssues}</td>
                <td>${highSeverityIssues === 0 ? 'None' : highSeverityIssues < 3 ? 'Low' : 'Critical'}</td>
            </tr>
        </table>
    </div>

    ${results.map(result => `
    <div class="file-section">
        <h2>📁 ${result.fileName}</h2>
        <p><strong>Language:</strong> ${result.language.charAt(0).toUpperCase() + result.language.slice(1)}</p>
        
        <h3>Quality Metrics</h3>
        <table>
            <tr>
                <th>Metric</th>
                <th>Score</th>
            </tr>
            <tr>
                <td>Code Quality</td>
                <td class="score ${result.qualityScore >= 85 ? 'excellent' : result.qualityScore >= 70 ? 'good' : result.qualityScore >= 50 ? 'fair' : 'poor'}">${result.qualityScore}/100</td>
            </tr>
            <tr>
                <td>Maintainability</td>
                <td class="score ${result.maintainabilityScore >= 85 ? 'excellent' : result.maintainabilityScore >= 70 ? 'good' : result.maintainabilityScore >= 50 ? 'fair' : 'poor'}">${result.maintainabilityScore}/100</td>
            </tr>
            <tr>
                <td>Performance</td>
                <td class="score ${result.performanceScore >= 85 ? 'excellent' : result.performanceScore >= 70 ? 'good' : result.performanceScore >= 50 ? 'fair' : 'poor'}">${result.performanceScore}/100</td>
            </tr>
        </table>

        ${result.issues.length > 0 ? `
        <h3>🔍 Issues Found (${result.issues.length})</h3>
        ${result.issues.map(issue => `
        <div class="issue ${issue.type}">
            <div class="severity ${issue.severity}">${issue.severity} ${issue.type}</div>
            ${issue.line ? `<p><strong>Line ${issue.line}:</strong></p>` : ''}
            <p>${issue.message}</p>
            ${issue.fix_suggestion ? `<p><strong>Fix:</strong> ${issue.fix_suggestion}</p>` : ''}
        </div>
        `).join('')}
        ` : '<p>✅ No issues found in this file.</p>'}

        ${result.strengths.length > 0 ? `
        <h3>💪 Strengths</h3>
        <ul>
            ${result.strengths.map(strength => `<li>${strength}</li>`).join('')}
        </ul>
        ` : ''}

        ${result.improvements.length > 0 ? `
        <h3>🚀 Suggested Improvements</h3>
        <ul>
            ${result.improvements.map(improvement => `<li>${improvement}</li>`).join('')}
        </ul>
        ` : ''}

        ${result.security_concerns.length > 0 ? `
        <h3>🔒 Security Concerns</h3>
        <ul>
            ${result.security_concerns.map(concern => `<li>${concern}</li>`).join('')}
        </ul>
        ` : ''}

        ${result.performance_notes.length > 0 ? `
        <h3>⚡ Performance Notes</h3>
        <ul>
            ${result.performance_notes.map(note => `<li>${note}</li>`).join('')}
        </ul>
        ` : ''}
    </div>
    `).join('')}

    <div class="summary">
        <h2>Recommendations</h2>
        <p>Based on the analysis results, here are the key recommendations:</p>
        <ul>
            ${averageQualityScore < 70 ? '<li>Focus on improving overall code quality by addressing high-severity issues first.</li>' : ''}
            ${highSeverityIssues > 0 ? '<li>Prioritize fixing high-severity issues to improve code stability and security.</li>' : ''}
            ${totalIssues > 10 ? '<li>Consider implementing automated code quality checks in your development workflow.</li>' : ''}
            <li>Regular code reviews and refactoring sessions can help maintain code quality over time.</li>
            <li>Consider adding automated testing to catch issues early in the development process.</li>
        </ul>
    </div>

    <hr style="margin: 40px 0; border: none; border-top: 2px solid #e2e8f0;">
    <p style="text-align: center; color: #64748b; font-size: 14px;">
        Generated by Vibe Coding Platform - ${new Date().toLocaleDateString()}
    </p>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code_analysis_report_${repository?.name || 'project'}_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportOptions(false);
  };

  const filteredResults = results.map(result => ({
    ...result,
    issues: result.issues.filter(issue => {
      const typeMatch = filter === 'all' || issue.type === filter;
      const severityMatch = severityFilter === 'all' || issue.severity === severityFilter;
      return typeMatch && severityMatch;
    })
  }));

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'suggestion': return <CheckCircle className="h-4 w-4 text-blue-400" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const totalIssues = results.reduce((sum, result) => sum + result.issues.length, 0);
  const averageScore = results.length > 0 ? Math.round(results.reduce((sum, result) => sum + result.qualityScore, 0) / results.length) : 0;

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <TestTube className="h-6 w-6 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Code Review & Quality Analysis</h2>
        </div>
        
        {results.length > 0 && (
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className={`font-medium ${getScoreColor(averageScore)}`}>
                Avg Score: {averageScore}/100
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <span className="text-gray-300">Issues: {totalIssues}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Configuration Panel */}
        <div className="w-80 border-r border-gray-700 flex flex-col">
          {/* File Selection */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-white">Select Files to Analyze</h3>
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Select All
                </button>
                <button
                  onClick={handleClearAll}
                  className="text-xs text-gray-400 hover:text-gray-300"
                >
                  Clear
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-400">Loading files...</span>
              </div>
            ) : codeFiles.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No code files found</p>
                <p className="text-xs text-gray-500 mt-1">
                  Supported: .js, .jsx, .ts, .tsx, .py, .java, .cpp, .c, .cs, .php, .rb, .go, .rs, .html, .css, .scss, .json, .md, .yml, .yaml, .xml
                </p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1">
                {codeFiles.map((file) => (
                  <label 
                    key={file.path} 
                    className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.path)}
                      onChange={() => handleFileToggle(file.path)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-300 truncate">{file.name}</div>
                      <div className="text-xs text-gray-500 truncate">{file.path}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      file.language === 'javascript' || file.language === 'typescript' ? 'bg-yellow-500/20 text-yellow-400' :
                      file.language === 'python' ? 'bg-green-500/20 text-green-400' :
                      file.language === 'html' || file.language === 'css' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {file.language}
                    </span>
                  </label>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              Selected: {selectedFiles.length} of {codeFiles.length} files
            </p>
          </div>
          </div>

          {/* Analysis Types */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-white">Analysis Types</h3>
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAllAnalysis}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Select All
                </button>
                <button
                  onClick={handleClearAllAnalysis}
                  className="text-xs text-gray-400 hover:text-gray-300"
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              {Object.entries(analysisTypes).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => handleAnalysisTypeToggle(key as keyof typeof analysisTypes)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Selected: {Object.values(analysisTypes).filter(Boolean).length} of {Object.keys(analysisTypes).length} analysis types
            </p>
          </div>

          {/* Advanced Settings */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-medium text-white mb-3">Advanced Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Analysis Depth</label>
                <select
                  value={analysisDepth}
                  onChange={(e) => setAnalysisDepth(e.target.value as 'standard' | 'deep')}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                >
                  <option value="standard">Standard Analysis</option>
                  <option value="deep">Deep Analysis</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Batch Size</label>
                <select
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                >
                  <option value={1}>1 file at a time</option>
                  <option value={3}>3 files at a time</option>
                  <option value={5}>5 files at a time</option>
                </select>
              </div>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeFix}
                  onChange={(e) => setIncludeFix(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Include Fix Suggestions</span>
              </label>
            </div>
          </div>

          {/* Run Analysis Button */}
          <div className="p-4">
            <button
              onClick={runAnalysis}
              disabled={selectedFiles.length === 0 || isAnalyzing || !Object.values(analysisTypes).some(Boolean) || loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isAnalyzing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>
                {isAnalyzing ? 'Analyzing...' : `Analyze ${selectedFiles.length} Files`}
              </span> 
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="flex-1 flex flex-col">
          {results.length > 0 && (
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value as any)}
                      className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                    >
                      <option value="all">All Results</option>
                      <option value="errors">Errors Only</option>
                      <option value="warnings">Warnings Only</option>
                      <option value="suggestions">Suggestions Only</option>
                    </select>
                  </div>
                  
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value as any)}
                    className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                  >
                    <option value="all">All Severities</option>
                    <option value="high">High Severity</option>
                    <option value="medium">Medium Severity</option>
                    <option value="low">Low Severity</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowExportOptions(!showExportOptions)}
                      className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    
                    {showExportOptions && (
                      <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[160px]">
                        <button
                          onClick={handleExportAsJSON}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-t-lg transition-colors"
                        >
                          <FileJson className="h-4 w-4" />
                          <span>Export as JSON</span>
                        </button>
                        <button
                          onClick={handleExportAsWord}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-b-lg transition-colors"
                        >
                          <FileType className="h-4 w-4" />
                          <span>Export as Word</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setResults([])}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Clear Results</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {results.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <TestTube className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-400 mb-2">No Analysis Results</h3>
                  <p className="text-gray-500">Select files and run analysis to see code quality results</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-6">
                {filteredResults.map((result, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                    {/* File Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-400" />
                        <h3 className="font-semibold text-white">{result.fileName}</h3>
                        <span className="text-sm text-gray-400">{result.language}</span>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(result.qualityScore)}`}>
                          {result.qualityScore}/100
                        </div>
                        <div className="text-sm text-gray-400">Quality Score</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(result.maintainabilityScore)}`}>
                          {result.maintainabilityScore}/100
                        </div>
                        <div className="text-sm text-gray-400">Maintainability</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(result.performanceScore)}`}>
                          {result.performanceScore}/100
                        </div>
                        <div className="text-sm text-gray-400">Performance</div>
                      </div>
                    </div>

                    {/* Issues */}
                    {result.issues.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-medium text-white mb-3 flex items-center space-x-2">
                          <XCircle className="h-4 w-4 text-red-400" />
                          <span>Code Issues ({result.issues.length})</span>
                        </h4>
                        <div className="space-y-3">
                          {result.issues.map((issue, issueIndex) => (
                            <div key={issueIndex} className="bg-gray-700 rounded p-3">
                              <div className="flex items-start space-x-2">
                                {getIssueIcon(issue.type)}
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-sm font-medium text-white capitalize">{issue.type}</span>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      issue.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                                      issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                      'bg-green-500/20 text-green-400'
                                    }`}>
                                      {issue.severity}
                                    </span>
                                    {issue.line && (
                                      <span className="text-xs text-gray-400">Line {issue.line}</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-300 mb-2">{issue.message}</p>
                                  {issue.fix_suggestion && (
                                    <p className="text-sm text-blue-300">
                                      <strong>Fix:</strong> {issue.fix_suggestion}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Strengths */}
                    {result.strengths.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-white mb-2 flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span>Strengths</span>
                        </h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          {result.strengths.map((strength, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <span className="text-green-400 mt-1">•</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Improvements */}
                    {result.improvements.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-white mb-2">Suggested Improvements</h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          {result.improvements.map((improvement, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <span className="text-blue-400 mt-1">•</span>
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}