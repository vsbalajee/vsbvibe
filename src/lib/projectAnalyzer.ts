interface CodePattern {
  type: 'component' | 'hook' | 'utility' | 'service' | 'type';
  pattern: string;
  frequency: number;
  examples: string[];
}

interface ImportPattern {
  library: string;
  importStyle: 'default' | 'named' | 'namespace' | 'mixed';
  frequency: number;
  examples: string[];
}

interface NamingConvention {
  type: 'component' | 'function' | 'variable' | 'file';
  convention: 'camelCase' | 'PascalCase' | 'kebab-case' | 'snake_case';
  frequency: number;
}

interface ProjectContext {
  // Framework and Library Detection
  primaryFramework: string;
  uiLibrary?: string;
  stateManagement?: string;
  styling: 'css' | 'scss' | 'tailwind' | 'styled-components' | 'emotion' | 'mixed';
  
  // Code Patterns
  componentPatterns: CodePattern[];
  importPatterns: ImportPattern[];
  namingConventions: NamingConvention[];
  
  // Architecture Insights
  folderStructure: 'feature-based' | 'type-based' | 'mixed';
  testingFramework?: string;
  
  // Coding Style
  functionStyle: 'arrow' | 'declaration' | 'mixed';
  typeScriptUsage: 'full' | 'partial' | 'none';
  
  // Project Metadata
  complexity: 'simple' | 'medium' | 'complex';
  maturity: 'new' | 'established' | 'legacy';
}

export class ProjectAnalyzer {
  private fileContents: Map<string, string> = new Map();
  private analysisCache: ProjectContext | null = null;

  constructor() {}

  async analyzeProject(
    files: Array<{ name: string; type: string; path: string; content?: string }>,
    repository?: { name: string; description: string; fullName: string }
  ): Promise<ProjectContext> {
    // Use cached analysis if available and recent
    if (this.analysisCache) {
      return this.analysisCache;
    }

    console.log('🔍 Analyzing project context...');

    // Filter and store code files
    const codeFiles = files.filter(f => 
      f.type === 'file' && 
      f.content && 
      this.isCodeFile(f.path)
    );

    codeFiles.forEach(file => {
      if (file.content) {
        this.fileContents.set(file.path, file.content);
      }
    });

    const context: ProjectContext = {
      primaryFramework: this.detectFramework(codeFiles),
      uiLibrary: this.detectUILibrary(codeFiles),
      stateManagement: this.detectStateManagement(codeFiles),
      styling: this.detectStylingApproach(codeFiles),
      componentPatterns: this.analyzeComponentPatterns(codeFiles),
      importPatterns: this.analyzeImportPatterns(codeFiles),
      namingConventions: this.analyzeNamingConventions(codeFiles),
      folderStructure: this.analyzeFolderStructure(files),
      testingFramework: this.detectTestingFramework(codeFiles),
      functionStyle: this.analyzeFunctionStyle(codeFiles),
      typeScriptUsage: this.analyzeTypeScriptUsage(codeFiles),
      complexity: this.assessComplexity(files),
      maturity: this.assessMaturity(codeFiles, repository)
    };

    this.analysisCache = context;
    console.log('✅ Project analysis complete:', context);
    return context;
  }

  private isCodeFile(path: string): boolean {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'];
    return codeExtensions.some(ext => path.endsWith(ext));
  }

  private detectFramework(files: Array<{ path: string; content?: string }>): string {
    const packageJsonFile = files.find(f => f.path.endsWith('package.json'));
    if (packageJsonFile?.content) {
      try {
        const pkg = JSON.parse(packageJsonFile.content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        if (deps.react) return 'React';
        if (deps.vue) return 'Vue';
        if (deps.angular) return 'Angular';
        if (deps.svelte) return 'Svelte';
        if (deps.express) return 'Express';
      } catch (e) {
        console.warn('Error parsing package.json:', e);
      }
    }

    // Analyze import patterns
    const reactImports = files.filter(f => 
      f.content?.includes("import React") || 
      f.content?.includes("from 'react'")
    ).length;

    const vueImports = files.filter(f => 
      f.content?.includes("import Vue") || 
      f.content?.includes(".vue")
    ).length;

    if (reactImports > 0) return 'React';
    if (vueImports > 0) return 'Vue';
    
    return 'Vanilla';
  }

  private detectUILibrary(files: Array<{ path: string; content?: string }>): string | undefined {
    const packageJsonFile = files.find(f => f.path.endsWith('package.json'));
    if (packageJsonFile?.content) {
      try {
        const pkg = JSON.parse(packageJsonFile.content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        if (deps['@mui/material'] || deps['@material-ui/core']) return 'Material-UI';
        if (deps['antd']) return 'Ant Design';
        if (deps['@chakra-ui/react']) return 'Chakra UI';
        if (deps['react-bootstrap']) return 'React Bootstrap';
        if (deps['semantic-ui-react']) return 'Semantic UI';
      } catch (e) {
        console.warn('Error parsing package.json for UI library:', e);
      }
    }

    // Check for Tailwind usage in code
    const tailwindUsage = files.filter(f => 
      f.content?.includes('className=') && 
      (f.content.includes('bg-') || f.content.includes('text-') || f.content.includes('p-'))
    ).length;

    if (tailwindUsage > 2) return 'Tailwind CSS';
    
    return undefined;
  }

  private detectStateManagement(files: Array<{ path: string; content?: string }>): string | undefined {
    const packageJsonFile = files.find(f => f.path.endsWith('package.json'));
    if (packageJsonFile?.content) {
      try {
        const pkg = JSON.parse(packageJsonFile.content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        if (deps['@reduxjs/toolkit'] || deps['redux']) return 'Redux';
        if (deps['zustand']) return 'Zustand';
        if (deps['recoil']) return 'Recoil';
        if (deps['mobx']) return 'MobX';
      } catch (e) {
        console.warn('Error parsing package.json for state management:', e);
      }
    }

    // Check for React Context usage
    const contextUsage = files.filter(f => 
      f.content?.includes('createContext') || 
      f.content?.includes('useContext')
    ).length;

    if (contextUsage > 1) return 'React Context';
    
    return undefined;
  }

  private detectStylingApproach(files: Array<{ path: string; content?: string }>): ProjectContext['styling'] {
    const cssFiles = files.filter(f => f.path.endsWith('.css')).length;
    const scssFiles = files.filter(f => f.path.endsWith('.scss') || f.path.endsWith('.sass')).length;
    
    // Check for Tailwind
    const tailwindUsage = files.filter(f => 
      f.content?.includes('className=') && 
      (f.content.includes('bg-') || f.content.includes('text-'))
    ).length;

    // Check for styled-components
    const styledComponentsUsage = files.filter(f => 
      f.content?.includes('styled.') || 
      f.content?.includes('import styled')
    ).length;

    if (tailwindUsage > 2) return 'tailwind';
    if (styledComponentsUsage > 0) return 'styled-components';
    if (scssFiles > 0) return 'scss';
    if (cssFiles > 0) return 'css';
    
    return 'mixed';
  }

  private analyzeComponentPatterns(files: Array<{ path: string; content?: string }>): CodePattern[] {
    const patterns: CodePattern[] = [];
    
    // Analyze React component patterns
    let functionalComponents = 0;
    let classComponents = 0;
    let arrowFunctionComponents = 0;
    
    files.forEach(file => {
      if (!file.content) return;
      
      // Functional components
      if (file.content.includes('function ') && file.content.includes('return (')) {
        functionalComponents++;
      }
      
      // Class components
      if (file.content.includes('class ') && file.content.includes('extends Component')) {
        classComponents++;
      }
      
      // Arrow function components
      if (file.content.includes('const ') && file.content.includes('= () =>')) {
        arrowFunctionComponents++;
      }
    });

    if (functionalComponents > 0) {
      patterns.push({
        type: 'component',
        pattern: 'functional',
        frequency: functionalComponents,
        examples: ['function ComponentName() { return (...); }']
      });
    }

    if (arrowFunctionComponents > 0) {
      patterns.push({
        type: 'component',
        pattern: 'arrow-function',
        frequency: arrowFunctionComponents,
        examples: ['const ComponentName = () => { return (...); }']
      });
    }

    if (classComponents > 0) {
      patterns.push({
        type: 'component',
        pattern: 'class',
        frequency: classComponents,
        examples: ['class ComponentName extends Component { render() { return (...); } }']
      });
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  private analyzeImportPatterns(files: Array<{ path: string; content?: string }>): ImportPattern[] {
    const importMap = new Map<string, { style: string; count: number; examples: string[] }>();
    
    files.forEach(file => {
      if (!file.content) return;
      
      const importLines = file.content.split('\n').filter(line => 
        line.trim().startsWith('import ')
      );
      
      importLines.forEach(line => {
        const match = line.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/);
        if (match) {
          const library = match[1];
          let style = 'named';
          
          if (line.includes('import ') && !line.includes('{')) {
            style = 'default';
          } else if (line.includes('* as ')) {
            style = 'namespace';
          } else if (line.includes('{') && !line.includes('import ')) {
            style = 'mixed';
          }
          
          if (!importMap.has(library)) {
            importMap.set(library, { style, count: 0, examples: [] });
          }
          
          const existing = importMap.get(library)!;
          existing.count++;
          if (existing.examples.length < 3) {
            existing.examples.push(line.trim());
          }
        }
      });
    });

    return Array.from(importMap.entries())
      .map(([library, data]) => ({
        library,
        importStyle: data.style as ImportPattern['importStyle'],
        frequency: data.count,
        examples: data.examples
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10); // Top 10 most used imports
  }

  private analyzeNamingConventions(files: Array<{ path: string; content?: string }>): NamingConvention[] {
    const conventions: NamingConvention[] = [];
    
    // Analyze file naming
    const fileNames = files.map(f => f.path.split('/').pop()?.split('.')[0]).filter(Boolean);
    const camelCaseFiles = fileNames.filter(name => /^[a-z][a-zA-Z0-9]*$/.test(name || '')).length;
    const pascalCaseFiles = fileNames.filter(name => /^[A-Z][a-zA-Z0-9]*$/.test(name || '')).length;
    const kebabCaseFiles = fileNames.filter(name => /^[a-z][a-z0-9-]*$/.test(name || '')).length;
    
    if (pascalCaseFiles > 0) {
      conventions.push({
        type: 'file',
        convention: 'PascalCase',
        frequency: pascalCaseFiles
      });
    }
    
    if (camelCaseFiles > 0) {
      conventions.push({
        type: 'file',
        convention: 'camelCase',
        frequency: camelCaseFiles
      });
    }
    
    if (kebabCaseFiles > 0) {
      conventions.push({
        type: 'file',
        convention: 'kebab-case',
        frequency: kebabCaseFiles
      });
    }

    return conventions.sort((a, b) => b.frequency - a.frequency);
  }

  private analyzeFolderStructure(files: Array<{ name: string; type: string; path: string }>): ProjectContext['folderStructure'] {
    const folders = files.filter(f => f.type === 'folder').map(f => f.path);
    
    // Check for feature-based structure
    const hasFeatureFolders = folders.some(folder => 
      folder.includes('/features/') || 
      folder.includes('/modules/') ||
      folder.match(/\/(auth|dashboard|profile|settings)\//i)
    );
    
    // Check for type-based structure
    const hasTypeFolders = folders.some(folder => 
      folder.includes('/components/') || 
      folder.includes('/hooks/') || 
      folder.includes('/utils/') ||
      folder.includes('/services/')
    );
    
    if (hasFeatureFolders && hasTypeFolders) return 'mixed';
    if (hasFeatureFolders) return 'feature-based';
    if (hasTypeFolders) return 'type-based';
    
    return 'mixed';
  }

  private detectTestingFramework(files: Array<{ path: string; content?: string }>): string | undefined {
    const packageJsonFile = files.find(f => f.path.endsWith('package.json'));
    if (packageJsonFile?.content) {
      try {
        const pkg = JSON.parse(packageJsonFile.content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        if (deps.vitest) return 'Vitest';
        if (deps.jest) return 'Jest';
        if (deps.mocha) return 'Mocha';
        if (deps.cypress) return 'Cypress';
        if (deps.playwright) return 'Playwright';
      } catch (e) {
        console.warn('Error parsing package.json for testing framework:', e);
      }
    }
    
    return undefined;
  }

  private analyzeFunctionStyle(files: Array<{ path: string; content?: string }>): ProjectContext['functionStyle'] {
    let arrowFunctions = 0;
    let declarationFunctions = 0;
    
    files.forEach(file => {
      if (!file.content) return;
      
      // Count arrow functions
      const arrowMatches = file.content.match(/=\s*\([^)]*\)\s*=>/g) || [];
      arrowFunctions += arrowMatches.length;
      
      // Count function declarations
      const declarationMatches = file.content.match(/function\s+\w+\s*\(/g) || [];
      declarationFunctions += declarationMatches.length;
    });
    
    if (arrowFunctions > declarationFunctions * 2) return 'arrow';
    if (declarationFunctions > arrowFunctions * 2) return 'declaration';
    return 'mixed';
  }

  private analyzeTypeScriptUsage(files: Array<{ path: string; content?: string }>): ProjectContext['typeScriptUsage'] {
    const tsFiles = files.filter(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx')).length;
    const jsFiles = files.filter(f => f.path.endsWith('.js') || f.path.endsWith('.jsx')).length;
    
    if (tsFiles === 0) return 'none';
    if (jsFiles === 0) return 'full';
    return 'partial';
  }

  private assessComplexity(files: Array<{ name: string; type: string; path: string }>): ProjectContext['complexity'] {
    const totalFiles = files.filter(f => f.type === 'file').length;
    const folders = files.filter(f => f.type === 'folder').length;
    
    if (totalFiles > 50 || folders > 10) return 'complex';
    if (totalFiles > 20 || folders > 5) return 'medium';
    return 'simple';
  }

  private assessMaturity(
    files: Array<{ path: string; content?: string }>,
    repository?: { name: string; description: string; fullName: string }
  ): ProjectContext['maturity'] {
    // Check for configuration files that indicate maturity
    const configFiles = files.filter(f => 
      f.path.includes('config') || 
      f.path.includes('.env') ||
      f.path.includes('docker') ||
      f.path.includes('ci') ||
      f.path.includes('github/workflows')
    ).length;
    
    const hasTests = files.some(f => 
      f.path.includes('.test.') || 
      f.path.includes('.spec.') ||
      f.path.includes('__tests__')
    );
    
    if (configFiles > 3 && hasTests) return 'established';
    if (configFiles > 1) return 'established';
    return 'new';
  }

  // Clear cache when project structure changes
  clearCache(): void {
    this.analysisCache = null;
    this.fileContents.clear();
  }

  // Get cached analysis
  getCachedAnalysis(): ProjectContext | null {
    return this.analysisCache;
  }
}

// Export singleton instance
export const projectAnalyzer = new ProjectAnalyzer();