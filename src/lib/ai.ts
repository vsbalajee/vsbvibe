import { projectAnalyzer } from './projectAnalyzer';
import { conversationAnalyzer } from './conversationAnalyzer';

interface AIResponse {
  suggestion: string;
  files: Array<{
    path: string;
    content: string;
    operation: 'create' | 'modify' | 'patch';
    language?: string;
  }>;
}

interface DocumentationResponse {
  suggestion: string;
  files: Array<{
    path: string;
    content: string;
    operation: 'create' | 'modify' | 'patch';
    language?: string;
    documentationType: string;
    description: string;
  }>;
}

interface CodeReviewResult {
  overall_score: number;
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

interface PerformanceAnalysis {
  performance_score: number;
  bottlenecks: Array<{
    line?: number;
    issue: string;
    impact: 'high' | 'medium' | 'low';
    solution: string;
  }>;
  optimizations: Array<{
    type: 'memory' | 'cpu' | 'network' | 'rendering' | 'bundle';
    description: string;
    implementation: string;
    estimated_improvement: string;
  }>;
  best_practices: string[];
  framework_specific_tips: string[];
}

export class OpenRouterAI {
  private apiKey: string = '';
  private baseUrl: string = 'https://openrouter.ai/api/v1';
  private model: string = 'qwen/qwen-2.5-72b-instruct';
  private temperature: number = 0.7;
  private maxTokens: number = 4000;

  constructor() {
    // Load settings from localStorage or use environment variables as fallback
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const savedSettings = localStorage.getItem('ai_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        this.apiKey = settings.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY || '';
        this.baseUrl = settings.baseUrl || import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
        this.model = settings.model || 'qwen/qwen-2.5-72b-instruct';
        this.temperature = settings.temperature || 0.7;
        this.maxTokens = settings.maxTokens || 4000;
      } else {
        // Use environment variables as defaults
        this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
        this.baseUrl = import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
      }
    } catch (error: any) {
      console.warn('Failed to load AI settings from localStorage:', error);
      // Fallback to environment variables
      this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
      this.baseUrl = import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    }
  }

  public updateSettings(settings: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): void {
    if (settings.apiKey !== undefined) this.apiKey = settings.apiKey;
    if (settings.baseUrl !== undefined) this.baseUrl = settings.baseUrl;
    if (settings.model !== undefined) this.model = settings.model;
    if (settings.temperature !== undefined) this.temperature = settings.temperature;
    if (settings.maxTokens !== undefined) this.maxTokens = settings.maxTokens;
    
    // Save to localStorage
    try {
      const settingsToSave = {
        apiKey: this.apiKey,
        baseUrl: this.baseUrl,
        model: this.model,
        temperature: this.temperature,
        maxTokens: this.maxTokens
      };
      localStorage.setItem('ai_settings', JSON.stringify(settingsToSave));
      console.log('✅ AI settings saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save AI settings to localStorage:', error);
    }
  }

  public getSettings(): {
    apiKey: string;
    baseUrl: string;
    model: string;
    temperature: number;
    maxTokens: number;
  } {
    return {
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      model: this.model,
      temperature: this.temperature,
      maxTokens: this.maxTokens
    };
  }

  public clearSettings(): void {
    try {
      localStorage.removeItem('ai_settings');
      // Reset to environment variables
      this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
      this.baseUrl = import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
      this.model = 'qwen/qwen-2.5-72b-instruct';
      this.temperature = 0.7;
      this.maxTokens = 4000;
      console.log('✅ AI settings cleared');
    } catch (error) {
      console.error('❌ Failed to clear AI settings:', error);
    }
  }

  isConfigured(): boolean {
    return !!(
      this.apiKey && 
      this.apiKey !== 'undefined' && 
      !this.apiKey.includes('your_openrouter_api_key_here')
    );
  }

  private async makeRequest(messages: any[]): Promise<any> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    console.log('🚀 Making OpenRouter API request:', {
      model: this.model,
      messagesCount: messages.length,
      apiKeyPresent: !!this.apiKey,
      baseUrl: this.baseUrl,
      temperature: this.temperature,
      maxTokens: this.maxTokens
    });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Vibe Coding Platform'
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens
      })
    });

    console.log('📡 OpenRouter API response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorDetails = `${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.text();
        console.error('❌ OpenRouter API error response body:', errorBody);
        errorDetails += ` - ${errorBody}`;
      } catch (e) {
        console.error('❌ Could not read error response body:', e);
      }
      throw new Error(`OpenRouter API error: ${errorDetails}`);
    }

    try {
      const data = await response.json();
      console.log('✅ OpenRouter API response data:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length || 0,
        hasContent: !!data.choices?.[0]?.message?.content,
        contentLength: data.choices?.[0]?.message?.content?.length || 0
      });
      
      const content = data.choices[0]?.message?.content || '';
      if (!content) {
        console.error('❌ No content in OpenRouter response:', data);
        throw new Error('No content received from OpenRouter API');
      }
      
      return content;
    } catch (parseError) {
      console.error('❌ Error parsing OpenRouter response:', parseError);
      throw new Error(`Failed to parse OpenRouter response: ${parseError.message}`);
    }
  }

  async generateCode(
    prompt: string,
    context: {
      currentFile?: { name: string; path: string; content: string; language: string };
      projectStructure?: Array<{ name: string; type: string; path: string; content?: string }>;
      repository?: { name: string; description: string; fullName: string };
      projectContext?: any;
    }
  ): Promise<AIResponse> {
    const systemPrompt = `You are an expert software developer and architect. Your role is to generate high-quality, production-ready code based on user requirements.

CRITICAL INSTRUCTIONS:
1. Always respond with valid JSON in this exact format:
{
  "suggestion": "Brief explanation of what you're implementing",
  "files": [
    {
      "path": "relative/path/to/file.ext",
      "content": "complete file content",
      "operation": "create|modify|patch",
      "language": "javascript|typescript|html|css|etc"
    }
  ]
}

2. Code Quality Requirements:
   - Write clean, maintainable, and well-documented code
   - Follow modern best practices and conventions
   - Use TypeScript when appropriate
   - Include proper error handling
   - Add meaningful comments for complex logic

3. Project Context Awareness:
   - Analyze the existing project structure and patterns
   - Maintain consistency with existing code style
   - Use the same libraries and frameworks already in the project
   - Follow the established naming conventions

4. File Operations:
   - "create": For new files
   - "modify": For complete file replacement
   - "patch": For partial modifications (provide complete file content)

5. Integration:
   - Ensure new code integrates seamlessly with existing codebase
   - Handle imports/exports correctly
   - Consider component relationships and data flow

Current Project Context:
${context.projectContext ? JSON.stringify(context.projectContext, null, 2) : 'No project context available'}

Current File Context:
${context.currentFile ? `
File: ${context.currentFile.path}
Language: ${context.currentFile.language}
Content: ${context.currentFile.content.substring(0, 1000)}...
` : 'No current file selected'}

Project Structure:
${context.projectStructure ? context.projectStructure.map(f => `${f.path} (${f.type})`).join('\n') : 'No project structure available'}

Repository Info:
${context.repository ? `Name: ${context.repository.name}\nDescription: ${context.repository.description}` : 'No repository info'}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    try {
      const response = await this.makeRequest(messages);
      
      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = response.trim();
      
      // Extract JSON from markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Fix common JSON escaping issues
      cleanedResponse = cleanedResponse
        .replace(/\\n/g, '\\\\n')
        .replace(/\\t/g, '\\\\t')
        .replace(/\\r/g, '\\\\r')
        .replace(/\\/g, '\\\\')
        .replace(/\\\\"/g, '\\"')
        .replace(/\\\\n/g, '\\n')
        .replace(/\\\\t/g, '\\t')
        .replace(/\\\\r/g, '\\r');
      
      // Handle conversational responses that aren't JSON
      if (!cleanedResponse.startsWith('{') && !cleanedResponse.startsWith('[')) {
        // If the AI gave a conversational response, extract JSON if present
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[0];
        } else {
          // If no JSON found, create a simple response structure
          return {
            suggestion: cleanedResponse,
            files: []
          };
        }
      }
      
      try {
        const parsed = JSON.parse(cleanedResponse);
        
        // Validate response structure
        if (!parsed.suggestion || !Array.isArray(parsed.files)) {
          throw new Error('Invalid response format from AI');
        }

        return parsed;
      } catch (jsonError) {
        console.error('❌ JSON parsing failed:', jsonError, 'Response:', cleanedResponse.substring(0, 200));
        
        // Try to fix common JSON issues and retry parsing
        try {
          // Remove any trailing commas
          let fixedResponse = cleanedResponse.replace(/,(\s*[}\]])/g, '$1');
          // Fix unescaped quotes in strings
          fixedResponse = fixedResponse.replace(/"([^"]*)"([^"]*)"([^"]*)"/g, '"$1\\"$2\\"$3"');
          
          const retryParsed = JSON.parse(fixedResponse);
          if (retryParsed.suggestion && Array.isArray(retryParsed.files)) {
            return retryParsed;
          }
        } catch (retryError) {
          console.error('❌ Retry JSON parsing also failed:', retryError);
        }
        
        // Fallback: Try to extract suggestion and create minimal response
        const suggestionMatch = cleanedResponse.match(/"suggestion":\s*"([^"]+)"/);
        const suggestion = suggestionMatch ? suggestionMatch[1] : 'AI generated a response but JSON parsing failed';
        
        return {
          suggestion,
          files: []
        };
      }
    } catch (error) {
      console.error('❌ Error generating code:', error);
      if (error.message.includes('OpenRouter API')) {
        throw error; // Re-throw API errors with full details
      }
      
      // Return a user-friendly error response instead of throwing
      return {
        suggestion: `Sorry, I encountered an error while generating code. The AI response contained invalid JSON formatting. Please try rephrasing your request or check your AI settings.`,
        files: []
      };
    }
  }

  async generateDocumentation(
    prompt: string,
    context: {
      documentationType: 'inline' | 'function' | 'readme' | 'project_overview' | 'api' | 'component';
      currentFile?: { name: string; path: string; content: string; language: string };
      projectStructure?: Array<{ name: string; type: string; path: string; content?: string }>;
      repository?: { name: string; description: string; fullName: string };
      projectContext?: any;
    }
  ): Promise<DocumentationResponse> {
    const systemPrompt = `You are an expert technical writer and documentation specialist. Your role is to generate comprehensive, clear, and useful documentation for software projects.

CRITICAL INSTRUCTIONS:
1. Always respond with valid JSON in this exact format:
{
  "suggestion": "Brief explanation of the documentation you're creating",
  "files": [
    {
      "path": "relative/path/to/file.ext",
      "content": "complete file content",
      "operation": "create|modify|patch",
      "language": "markdown|javascript|typescript|etc",
      "documentationType": "${context.documentationType}",
      "description": "Brief description of this documentation file"
    }
  ]
}

2. Documentation Types:
   - "inline": Add inline comments to explain complex code logic
   - "function": Generate JSDoc/docstring comments for functions and methods
   - "readme": Create comprehensive README.md files
   - "project_overview": High-level project documentation and architecture
   - "api": API endpoint documentation and data models
   - "component": Component documentation with props, usage examples

3. Documentation Quality:
   - Write clear, concise, and helpful documentation
   - Use proper formatting (Markdown for .md files, JSDoc for functions)
   - Include examples where appropriate
   - Follow documentation best practices
   - Make it accessible to developers of different skill levels

4. Context Awareness:
   - Analyze the project structure and technology stack
   - Use appropriate terminology for the framework/language
   - Reference actual file names, functions, and components from the project
   - Maintain consistency with existing documentation style

5. File Operations:
   - "create": For new documentation files (README.md, docs/*.md)
   - "modify": For adding documentation to existing code files
   - "patch": For updating existing documentation

Current Documentation Type: ${context.documentationType}

Project Context:
${context.projectContext ? JSON.stringify(context.projectContext, null, 2) : 'No project context available'}

Current File Context:
${context.currentFile ? `
File: ${context.currentFile.path}
Language: ${context.currentFile.language}
Content: ${context.currentFile.content.substring(0, 2000)}...
` : 'No current file selected'}

Project Structure:
${context.projectStructure ? context.projectStructure.map(f => `${f.path} (${f.type})`).join('\n') : 'No project structure available'}

Repository Info:
${context.repository ? `Name: ${context.repository.name}\nDescription: ${context.repository.description}` : 'No repository info'}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    try {
      const response = await this.makeRequest(messages);
      console.log('📝 Raw documentation response:', response.substring(0, 500) + '...');
      
      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanedResponse);
      
      // Validate response structure
      if (!parsed.suggestion || !Array.isArray(parsed.files)) {
        console.error('❌ Invalid documentation response structure:', parsed);
        throw new Error('Invalid response format from AI');
      }

      // Ensure each file has the required documentation fields
      parsed.files = parsed.files.map((file: any) => ({
        ...file,
        documentationType: file.documentationType || context.documentationType,
        description: file.description || `${context.documentationType} documentation`
      }));

      console.log('✅ Successfully generated documentation:', {
        filesCount: parsed.files.length,
        suggestion: parsed.suggestion.substring(0, 100) + '...'
      });

      return parsed;
    } catch (error) {
      console.error('❌ Error generating documentation:', error);
      if (error.message.includes('OpenRouter API')) {
        throw error; // Re-throw API errors with full details
      }
      if (error.message.includes('JSON')) {
        throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
      }
      throw new Error(`Failed to generate documentation: ${error.message}`);
    }
  }

  async performCodeReview(
    code: string,
    fileName: string,
    language: string,
    projectContext?: any
  ): Promise<CodeReviewResult> {
    const systemPrompt = `You are an expert code reviewer with extensive experience in software development best practices, security, and performance optimization.

CRITICAL INSTRUCTIONS:
1. Always respond with valid JSON in this exact format:
{
  "overall_score": 85,
  "issues": [
    {
      "type": "error|warning|suggestion",
      "line": 42,
      "message": "Clear description of the issue",
      "severity": "high|medium|low",
      "fix_suggestion": "Specific suggestion on how to fix this issue"
    }
  ],
  "strengths": ["List of positive aspects of the code"],
  "improvements": ["List of general improvement suggestions"],
  "security_concerns": ["List of security-related issues"],
  "performance_notes": ["List of performance-related observations"]
}

2. Review Criteria:
   - Code quality and maintainability
   - Security vulnerabilities
   - Performance issues
   - Best practices adherence
   - Error handling
   - Code organization and structure
   - Documentation and comments

3. Scoring (0-100):
   - 90-100: Excellent code with minor or no issues
   - 80-89: Good code with some improvements needed
   - 70-79: Acceptable code with several issues
   - 60-69: Poor code with many issues
   - Below 60: Code needs significant refactoring

4. Issue Types:
   - "error": Critical issues that could cause bugs or failures
   - "warning": Important issues that should be addressed
   - "suggestion": Recommendations for improvement

5. Context Awareness:
   - Consider the project's technology stack and conventions
   - Provide framework-specific recommendations
   - Account for the project's complexity and maturity

File: ${fileName}
Language: ${language}
Project Context: ${projectContext ? JSON.stringify(projectContext, null, 2) : 'No context available'}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please review this ${language} code:\n\n${code}` }
    ];

    try {
      const response = await this.makeRequest(messages);
      
      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanedResponse);
      
      // Validate response structure
      if (typeof parsed.overall_score !== 'number' || !Array.isArray(parsed.issues)) {
        throw new Error('Invalid response format from AI');
      }

      return parsed;
    } catch (error) {
      console.error('❌ Error performing code review:', error);
      if (error.message.includes('OpenRouter API')) {
        throw error; // Re-throw API errors with full details
      }
      throw new Error(`Failed to perform code review: ${error.message}`);
    }
  }

  async analyzePerformance(
    code: string,
    fileName: string,
    language: string,
    projectContext?: any
  ): Promise<PerformanceAnalysis> {
    const systemPrompt = `You are an expert performance analyst specializing in code optimization and performance bottleneck identification.

CRITICAL INSTRUCTIONS:
1. Always respond with valid JSON in this exact format:
{
  "performance_score": 75,
  "bottlenecks": [
    {
      "line": 42,
      "issue": "Description of the performance issue",
      "impact": "high|medium|low",
      "solution": "Specific solution to address this bottleneck"
    }
  ],
  "optimizations": [
    {
      "type": "memory|cpu|network|rendering|bundle",
      "description": "Description of the optimization opportunity",
      "implementation": "How to implement this optimization",
      "estimated_improvement": "Expected performance gain"
    }
  ],
  "best_practices": ["List of performance best practices to follow"],
  "framework_specific_tips": ["Framework-specific performance recommendations"]
}

2. Analysis Focus Areas:
   - Memory usage and leaks
   - CPU-intensive operations
   - Network requests and data fetching
   - Rendering performance (for UI code)
   - Bundle size and loading performance
   - Algorithm efficiency
   - Database query optimization (if applicable)

3. Performance Scoring (0-100):
   - 90-100: Highly optimized code
   - 80-89: Well-optimized with minor improvements possible
   - 70-79: Good performance with some optimization opportunities
   - 60-69: Moderate performance issues
   - Below 60: Significant performance problems

4. Impact Levels:
   - "high": Critical performance issues that significantly affect user experience
   - "medium": Noticeable performance issues that should be addressed
   - "low": Minor optimizations that could provide small improvements

5. Context Awareness:
   - Consider the specific framework and language performance characteristics
   - Provide technology-specific optimization recommendations
   - Account for the application's scale and usage patterns

File: ${fileName}
Language: ${language}
Project Context: ${projectContext ? JSON.stringify(projectContext, null, 2) : 'No context available'}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please analyze the performance of this ${language} code:\n\n${code}` }
    ];

    try {
      const response = await this.makeRequest(messages);
      
      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanedResponse);
      
      // Validate response structure
      if (typeof parsed.performance_score !== 'number' || !Array.isArray(parsed.bottlenecks)) {
        throw new Error('Invalid response format from AI');
      }

      return parsed;
    } catch (error) {
      console.error('❌ Error analyzing performance:', error);
      if (error.message.includes('OpenRouter API')) {
        throw error; // Re-throw API errors with full details
      }
      throw new Error(`Failed to analyze performance: ${error.message}`);
    }
  }

  async chatDiscussion(
    message: string,
    context: {
      currentFile?: { name: string; path: string; content: string; language: string };
      projectStructure?: Array<{ name: string; type: string; path: string; content?: string }>;
      repository?: { name: string; description: string; fullName: string };
      projectContext?: any;
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
      selectedTemplate?: string;
      mode?: 'discuss' | 'generate' | 'test' | 'docs';
    }
  ): Promise<string> {
    // Analyze conversation context for intelligent responses
    const conversationContext = conversationAnalyzer.analyzeConversation(
      context.conversationHistory || [],
      context.selectedTemplate,
      context.projectContext
    );

    let systemPrompt = `You are Bolt, an expert AI assistant and exceptional senior software developer with vast knowledge across multiple programming languages, frameworks, and web design best practices.

You are powered by Claude Sonnet 4, from the new Claude 4 model family. Claude Sonnet 4 is a smart, efficient model for everyday use.

CONVERSATION CONTEXT ANALYSIS:
- User Expertise Level: ${conversationContext.userExpertiseLevel}
- Conversation Tone: ${conversationContext.conversationTone}
- Project Phase: ${conversationContext.projectPhase}
- Current Focus Areas: ${conversationContext.currentFocus.join(', ') || 'General'}
- Previous Topics: ${conversationContext.previousTopics.join(', ') || 'None'}
- User Preferences: ${JSON.stringify(conversationContext.userPreferences)}

CRITICAL INSTRUCTIONS:
1. ADAPT YOUR COMMUNICATION STYLE:
   - For ${conversationContext.userExpertiseLevel} users: ${this.getExpertiseGuidance(conversationContext.userExpertiseLevel)}
   - Use ${conversationContext.conversationTone} tone throughout your response
   - Focus on ${conversationContext.projectPhase} phase considerations

2. PROVIDE CONTEXTUAL GUIDANCE:
   - Build upon previous topics discussed: ${conversationContext.previousTopics.join(', ')}
   - Address current focus areas: ${conversationContext.currentFocus.join(', ')}
   - Consider user's preferred tech stack: ${conversationContext.userPreferences.preferredTechStack?.join(', ') || 'Not specified'}

3. INTELLIGENT RESPONSE STRUCTURE:
   - Start by acknowledging their specific question/request
   - Provide detailed, actionable guidance appropriate for their expertise level
   - Include specific examples relevant to their project context
   - End with 2-3 intelligent follow-up questions or next steps
   - Suggest related features or improvements they might not have considered

4. PROACTIVE SUGGESTIONS:
   - Based on project phase (${conversationContext.projectPhase}), suggest appropriate next steps
   - Recommend best practices for their expertise level
   - Anticipate common challenges and provide preventive guidance
   - Connect current discussion to broader project goals

RESPONSE STYLE:
- Acknowledge their specific request with understanding of context
- Provide guidance tailored to their expertise and project phase  
- Use examples that match their preferred technologies and complexity level
- Structure information clearly (use bullet points for complex topics)
- Be encouraging and build confidence while maintaining technical accuracy
- Always provide actionable next steps that move the project forward`;

    // Add template-specific context for Generate mode
    if (context.mode === 'generate' && context.selectedTemplate) {
      systemPrompt += `

TEMPLATE CONTEXT:
The user has selected the "${context.selectedTemplate}" template. Provide guidance specific to this type of application:
- Focus on features and functionality relevant to this template
- Suggest best practices for this specific use case
- Ask clarifying questions about their specific requirements for this template
- Guide them through the typical development workflow for this type of project`;
    }

    systemPrompt += `

Current Project Context:
${context.projectContext ? JSON.stringify(context.projectContext, null, 2) : 'No project context available'}

Current File Context:
${context.currentFile ? `
File: ${context.currentFile.path}
Language: ${context.currentFile.language}
Content Preview: ${context.currentFile.content.substring(0, 1000)}...
` : 'No current file selected'}

Project Structure:
${context.projectStructure ? context.projectStructure.map(f => `${f.path} (${f.type})`).join('\n') : 'No project structure available'}

Repository Info:
${context.repository ? `Name: ${context.repository.name}\nDescription: ${context.repository.description}` : 'No repository info'}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(context.conversationHistory || []),
      { role: 'user', content: message }
    ];

    try {
      const response = await this.makeRequest(messages);
      
      // Store conversation context for future reference
      context.conversationContext = conversationContext;
      
      return response;
    } catch (error) {
      console.error('❌ Error in chat discussion:', error);
      if (error.message.includes('OpenRouter API')) {
        throw error; // Re-throw API errors with full details
      }
      throw new Error(`Failed to process your message: ${error.message}`);
    }
  }

  private getExpertiseGuidance(level: string): string {
    switch (level) {
      case 'beginner':
        return 'Use simple language, explain concepts clearly, provide step-by-step guidance, avoid jargon';
      case 'intermediate':
        return 'Balance explanation with implementation details, reference best practices, suggest learning resources';
      case 'advanced':
        return 'Focus on architecture decisions, performance considerations, advanced patterns, trade-offs';
      case 'expert':
        return 'Discuss high-level architecture, scalability concerns, cutting-edge approaches, system design';
      default:
        return 'Adapt explanation depth based on user responses, start with clear explanations';
    }
  }
}

// Export singleton instance
export const openRouterAI = new OpenRouterAI();