import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/LoginPage';
import { MainHub } from './components/MainHub';
import { RepositorySelector } from './components/RepositorySelector';
import { AuthCallback } from './components/AuthCallback';
import { SetupGuide } from './components/SetupGuide';
import { ProjectWorkspace } from './components/CodingWorkspace';
import { ProjectGenerationMode } from './components/ProjectGenerationMode';
import * as configChecks from './lib/configChecks';

function App() {
  const { user, loading } = useAuth();

  // Handle project creation completion
  const handleProjectCreated = (projectName: string, repoUrl: string, template?: any, aiContext?: any) => {
    // Navigate to workspace with the new project
    const params = new URLSearchParams({
      repo: `${user?.github_username}/${projectName}`,
      name: projectName,
      description: template?.description || 'Generated with Vibe AI',
      branch: 'main',
      mode: 'generate',
      templateName: template?.name || '',
      templateDescription: template?.description || '',
      initialAIMessage: 'true',
      aiContext: aiContext ? JSON.stringify(aiContext) : ''
    });
    const workspaceUrl = `/workspace?${params.toString()}`;
    window.location.href = workspaceUrl;
  };

  // Check if basic environment is configured
  const checkEnvVar = (varName: string) => {
    const value = import.meta.env[varName];
    return value && 
           value !== 'undefined' && 
           !value.includes('your_') && 
           (varName.includes('URL') ? value.startsWith('http') : true);
  };

  const isConfigured = checkEnvVar('VITE_GITHUB_CLIENT_ID') && 
                      configChecks.isSupabaseConfigured();

  // Handle dependency installation
  const handleInstallDependencies = async (dependencies: string[]) => {
    try {
      console.log('Installing dependencies:', dependencies);
      
      // Read current package.json
      let packageJsonContent;
      try {
        const packageJsonResponse = await fetch('/package.json');
        if (packageJsonResponse.ok) {
          packageJsonContent = await packageJsonResponse.text();
        } else {
          throw new Error('Could not read package.json');
        }
      } catch (error) {
        console.error('Error reading package.json:', error);
        throw new Error('Failed to read package.json');
      }
      
      // Parse package.json
      const packageJson = JSON.parse(packageJsonContent);
      
      // Add new dependencies
      if (!packageJson.dependencies) {
        packageJson.dependencies = {};
      }
      
      let hasNewDependencies = false;
      dependencies.forEach(dep => {
        // Handle dependencies with version specifiers (e.g., "react@^18.0.0")
        const [packageName, version] = dep.includes('@') && !dep.startsWith('@') 
          ? dep.split('@') 
          : [dep, 'latest'];
        
        if (!packageJson.dependencies[packageName]) {
          packageJson.dependencies[packageName] = `^${version === 'latest' ? 'latest' : version}`;
          hasNewDependencies = true;
          console.log(`Added dependency: ${packageName}@${version}`);
        }
      });
      
      if (!hasNewDependencies) {
        console.log('No new dependencies to install');
        return;
      }
      
      // Write updated package.json
      const updatedPackageJson = JSON.stringify(packageJson, null, 2);
      
      // Create a blob and download it (since we can't directly write to the file system in browser)
      // This is a limitation of the browser environment - in a real WebContainer, this would work differently
      const blob = new Blob([updatedPackageJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // For now, we'll simulate the installation process
      // In a real WebContainer environment, you would use:
      // await webcontainer.fs.writeFile('/package.json', updatedPackageJson);
      // await webcontainer.spawn('npm', ['install']);
      
      console.log('Dependencies would be installed:', dependencies);
      console.log('Updated package.json:', updatedPackageJson);
      
      // Simulate installation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clean up
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error installing dependencies:', error);
      throw error;
    }
  };

  // Show setup guide if not configured
  if (!isConfigured) {
    return <SetupGuide />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/setup" element={<SetupGuide />} />
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <LoginPage />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <MainHub /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/create-project" 
          element={user ? <ProjectGenerationMode onProjectCreated={handleProjectCreated} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/select-repository/:mode" 
          element={user ? <RepositorySelector /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/workspace" 
          element={user ? <ProjectWorkspace onInstallDependencies={handleInstallDependencies} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/auth/callback" 
          element={<AuthCallback />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/login"} />}
        />
      </Routes>
    </Router>
  );
}

export default App;