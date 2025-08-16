interface ConversationContext {
  currentTemplate?: string;
  projectPhase: 'planning' | 'implementation' | 'testing' | 'deployment' | 'maintenance';
  userExpertiseLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  conversationTone: 'casual' | 'professional' | 'technical' | 'educational';
  previousTopics: string[];
  currentFocus: string[];
  suggestedNextSteps: string[];
  userPreferences: {
    preferredTechStack?: string[];
    learningGoals?: string[];
    projectComplexity?: 'simple' | 'medium' | 'complex';
  };
}

interface ConversationPattern {
  pattern: RegExp;
  intent: 'question' | 'request' | 'clarification' | 'feedback' | 'exploration';
  confidence: number;
  suggestedResponses: string[];
  nextStepCategories: string[];
}

export class ConversationAnalyzer {
  private patterns: ConversationPattern[] = [
    // Question patterns
    {
      pattern: /^(how|what|why|when|where|which|can|could|should|would|is|are|do|does|will)\s/i,
      intent: 'question',
      confidence: 0.9,
      suggestedResponses: ['Provide detailed explanation', 'Offer examples', 'Suggest implementation'],
      nextStepCategories: ['implementation', 'planning', 'enhancement']
    },
    
    // Implementation request patterns
    {
      pattern: /(create|build|make|implement|add|generate|develop|code|write)\s/i,
      intent: 'request',
      confidence: 0.95,
      suggestedResponses: ['Switch to Generate mode', 'Provide step-by-step plan', 'Offer alternatives'],
      nextStepCategories: ['implementation', 'testing']
    },
    
    // Clarification patterns
    {
      pattern: /(explain|clarify|elaborate|detail|expand|tell me more|what do you mean)/i,
      intent: 'clarification',
      confidence: 0.8,
      suggestedResponses: ['Provide detailed explanation', 'Use analogies', 'Give examples'],
      nextStepCategories: ['planning', 'enhancement']
    },
    
    // Feedback patterns
    {
      pattern: /(good|great|perfect|excellent|thanks|thank you|that works|looks good)/i,
      intent: 'feedback',
      confidence: 0.7,
      suggestedResponses: ['Suggest next steps', 'Offer related features', 'Ask follow-up questions'],
      nextStepCategories: ['enhancement', 'testing', 'deployment']
    },
    
    // Exploration patterns
    {
      pattern: /(options|alternatives|possibilities|different ways|other approaches|best practices)/i,
      intent: 'exploration',
      confidence: 0.85,
      suggestedResponses: ['List alternatives', 'Compare approaches', 'Recommend best practices'],
      nextStepCategories: ['planning', 'enhancement']
    }
  ];

  private templateKeywords = {
    'website-clone': ['clone', 'copy', 'replicate', 'similar', 'like', 'based on'],
    'ecommerce': ['store', 'shop', 'product', 'cart', 'payment', 'checkout', 'inventory'],
    'booking': ['appointment', 'schedule', 'calendar', 'booking', 'reservation', 'time slot'],
    'dashboard': ['dashboard', 'admin', 'analytics', 'charts', 'data', 'metrics', 'reports'],
    'forum': ['forum', 'discussion', 'community', 'posts', 'comments', 'threads', 'moderation'],
    'blog': ['blog', 'articles', 'posts', 'content', 'cms', 'publishing', 'writing'],
    'portfolio': ['portfolio', 'showcase', 'projects', 'work', 'gallery', 'resume'],
    'landing': ['landing', 'marketing', 'conversion', 'lead', 'signup', 'cta']
  };

  analyzeConversation(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    currentTemplate?: string,
    projectContext?: any
  ): ConversationContext {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const allUserMessages = messages.filter(m => m.role === 'user').map(m => m.content);
    
    // Analyze user expertise level
    const expertiseLevel = this.analyzeExpertiseLevel(allUserMessages);
    
    // Detect conversation tone
    const conversationTone = this.detectConversationTone(allUserMessages);
    
    // Extract topics discussed
    const previousTopics = this.extractTopics(messages);
    
    // Determine project phase
    const projectPhase = this.determineProjectPhase(allUserMessages, projectContext);
    
    // Analyze current focus
    const currentFocus = this.analyzeCurrentFocus(lastUserMessage);
    
    // Generate suggested next steps
    const suggestedNextSteps = this.generateNextSteps(lastUserMessage, currentTemplate, projectPhase);
    
    // Extract user preferences
    const userPreferences = this.extractUserPreferences(allUserMessages);

    return {
      currentTemplate,
      projectPhase,
      userExpertiseLevel: expertiseLevel,
      conversationTone,
      previousTopics,
      currentFocus,
      suggestedNextSteps,
      userPreferences
    };
  }

  private analyzeExpertiseLevel(messages: string[]): ConversationContext['userExpertiseLevel'] {
    const allText = messages.join(' ').toLowerCase();
    
    // Advanced indicators
    const advancedTerms = ['architecture', 'scalability', 'microservices', 'optimization', 'performance', 'security', 'deployment', 'ci/cd', 'docker', 'kubernetes'];
    const advancedCount = advancedTerms.filter(term => allText.includes(term)).length;
    
    // Beginner indicators
    const beginnerPhrases = ['how do i', 'what is', 'i don\'t know', 'i\'m new to', 'can you explain', 'simple way'];
    const beginnerCount = beginnerPhrases.filter(phrase => allText.includes(phrase)).length;
    
    // Technical indicators
    const technicalTerms = ['api', 'database', 'frontend', 'backend', 'framework', 'library', 'component'];
    const technicalCount = technicalTerms.filter(term => allText.includes(term)).length;
    
    if (advancedCount >= 3) return 'expert';
    if (advancedCount >= 1 && technicalCount >= 3) return 'advanced';
    if (technicalCount >= 2 && beginnerCount === 0) return 'intermediate';
    return 'beginner';
  }

  private detectConversationTone(messages: string[]): ConversationContext['conversationTone'] {
    const allText = messages.join(' ').toLowerCase();
    
    // Professional indicators
    const professionalTerms = ['requirements', 'specifications', 'deliverables', 'timeline', 'stakeholders'];
    const professionalCount = professionalTerms.filter(term => allText.includes(term)).length;
    
    // Technical indicators
    const technicalTerms = ['implementation', 'architecture', 'algorithm', 'optimization', 'configuration'];
    const technicalCount = technicalTerms.filter(term => allText.includes(term)).length;
    
    // Educational indicators
    const educationalPhrases = ['learn', 'understand', 'explain', 'teach me', 'how does', 'why does'];
    const educationalCount = educationalPhrases.filter(phrase => allText.includes(phrase)).length;
    
    // Casual indicators
    const casualPhrases = ['hey', 'hi', 'thanks', 'cool', 'awesome', 'great'];
    const casualCount = casualPhrases.filter(phrase => allText.includes(phrase)).length;
    
    if (professionalCount >= 2) return 'professional';
    if (technicalCount >= 3) return 'technical';
    if (educationalCount >= 2) return 'educational';
    return 'casual';
  }

  private extractTopics(messages: Array<{ role: 'user' | 'assistant'; content: string }>): string[] {
    const topics = new Set<string>();
    const allText = messages.map(m => m.content).join(' ').toLowerCase();
    
    // Technology topics
    const techTopics = ['react', 'vue', 'angular', 'node', 'express', 'database', 'api', 'frontend', 'backend', 'typescript', 'javascript'];
    techTopics.forEach(topic => {
      if (allText.includes(topic)) topics.add(topic);
    });
    
    // Feature topics
    const featureTopics = ['authentication', 'payment', 'search', 'notification', 'dashboard', 'admin', 'user management'];
    featureTopics.forEach(topic => {
      if (allText.includes(topic)) topics.add(topic);
    });
    
    // Template-specific topics
    Object.entries(this.templateKeywords).forEach(([template, keywords]) => {
      if (keywords.some(keyword => allText.includes(keyword))) {
        topics.add(template);
      }
    });
    
    return Array.from(topics);
  }

  private determineProjectPhase(messages: string[], projectContext?: any): ConversationContext['projectPhase'] {
    const allText = messages.join(' ').toLowerCase();
    
    // Deployment phase indicators
    if (allText.includes('deploy') || allText.includes('production') || allText.includes('live')) {
      return 'deployment';
    }
    
    // Testing phase indicators
    if (allText.includes('test') || allText.includes('bug') || allText.includes('error') || allText.includes('debug')) {
      return 'testing';
    }
    
    // Implementation phase indicators
    if (allText.includes('create') || allText.includes('build') || allText.includes('implement') || allText.includes('code')) {
      return 'implementation';
    }
    
    // Planning phase indicators (default for new conversations)
    return 'planning';
  }

  private analyzeCurrentFocus(message: string): string[] {
    const focus = [];
    const lowerMessage = message.toLowerCase();
    
    // UI/UX focus
    if (lowerMessage.includes('design') || lowerMessage.includes('ui') || lowerMessage.includes('ux') || lowerMessage.includes('interface')) {
      focus.push('ui/ux');
    }
    
    // Backend focus
    if (lowerMessage.includes('backend') || lowerMessage.includes('server') || lowerMessage.includes('api') || lowerMessage.includes('database')) {
      focus.push('backend');
    }
    
    // Frontend focus
    if (lowerMessage.includes('frontend') || lowerMessage.includes('client') || lowerMessage.includes('component') || lowerMessage.includes('react')) {
      focus.push('frontend');
    }
    
    // Performance focus
    if (lowerMessage.includes('performance') || lowerMessage.includes('speed') || lowerMessage.includes('optimize') || lowerMessage.includes('slow')) {
      focus.push('performance');
    }
    
    // Security focus
    if (lowerMessage.includes('security') || lowerMessage.includes('auth') || lowerMessage.includes('secure') || lowerMessage.includes('permission')) {
      focus.push('security');
    }
    
    return focus.length > 0 ? focus : ['general'];
  }

  private generateNextSteps(message: string, template?: string, phase?: string): string[] {
    const steps = [];
    const lowerMessage = message.toLowerCase();
    
    // Template-specific next steps
    if (template) {
      switch (template) {
        case 'website-clone':
          steps.push('Customize the cloned design', 'Add interactive features', 'Optimize for mobile');
          break;
        case 'ecommerce':
          steps.push('Set up product catalog', 'Implement shopping cart', 'Configure payment gateway');
          break;
        case 'booking':
          steps.push('Design calendar interface', 'Set up user authentication', 'Configure notifications');
          break;
        case 'dashboard':
          steps.push('Create data visualization', 'Set up user roles', 'Implement real-time updates');
          break;
      }
    }
    
    // Phase-specific next steps
    switch (phase) {
      case 'planning':
        steps.push('Define requirements', 'Choose tech stack', 'Create wireframes');
        break;
      case 'implementation':
        steps.push('Write tests', 'Implement features', 'Set up CI/CD');
        break;
      case 'testing':
        steps.push('Run performance tests', 'Fix bugs', 'Optimize code');
        break;
      case 'deployment':
        steps.push('Configure production environment', 'Set up monitoring', 'Plan maintenance');
        break;
    }
    
    // Intent-based next steps
    if (lowerMessage.includes('how')) {
      steps.push('Provide implementation guide', 'Show code examples', 'Explain best practices');
    }
    
    return [...new Set(steps)]; // Remove duplicates
  }

  private extractUserPreferences(messages: string[]): ConversationContext['userPreferences'] {
    const allText = messages.join(' ').toLowerCase();
    const preferences: ConversationContext['userPreferences'] = {};
    
    // Tech stack preferences
    const techStacks = ['react', 'vue', 'angular', 'node', 'express', 'next', 'nuxt', 'typescript', 'javascript'];
    const mentionedTech = techStacks.filter(tech => allText.includes(tech));
    if (mentionedTech.length > 0) {
      preferences.preferredTechStack = mentionedTech;
    }
    
    // Learning goals
    const learningKeywords = ['learn', 'understand', 'master', 'improve', 'practice'];
    if (learningKeywords.some(keyword => allText.includes(keyword))) {
      preferences.learningGoals = ['skill development', 'best practices', 'hands-on experience'];
    }
    
    // Project complexity
    if (allText.includes('simple') || allText.includes('basic') || allText.includes('minimal')) {
      preferences.projectComplexity = 'simple';
    } else if (allText.includes('complex') || allText.includes('advanced') || allText.includes('enterprise')) {
      preferences.projectComplexity = 'complex';
    } else {
      preferences.projectComplexity = 'medium';
    }
    
    return preferences;
  }

  analyzeIntent(message: string): { intent: string; confidence: number; suggestions: string[] } {
    for (const pattern of this.patterns) {
      if (pattern.pattern.test(message)) {
        return {
          intent: pattern.intent,
          confidence: pattern.confidence,
          suggestions: pattern.suggestedResponses
        };
      }
    }
    
    return {
      intent: 'general',
      confidence: 0.5,
      suggestions: ['Provide helpful response', 'Ask clarifying questions', 'Suggest next steps']
    };
  }
}

// Export singleton instance
export const conversationAnalyzer = new ConversationAnalyzer();