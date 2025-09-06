import { BaseAgent, LLMAgent } from '../core/agent-base';
import {
  AgentTask,
  AgentResult,
  ValidationResult,
  AgentCapabilities,
  AgentLogger,
  AgentMetrics,
} from '../types/agent-types';
import {
  FormQualityAssessor,
  QualityReport,
} from './standard-agent/form-quality-assessor';
import {
  PromptTemplateManager,
  PromptTemplateUtils,
} from './standard-agent/prompt-templates';

/**
 * Standard Agent for enhanced form generation with AI intelligence
 */
export class StandardAgent extends LLMAgent {
  private formQualityAssessor: FormQualityAssessor;
  private promptTemplateManager: PromptTemplateManager;

  constructor(
    id: string,
    name: string,
    version: string,
    logger: AgentLogger,
    metrics: AgentMetrics
  ) {
    super(id, name, version, logger, metrics);
    this.formQualityAssessor = new FormQualityAssessor(logger);
    this.promptTemplateManager = new PromptTemplateManager();
  }

  getCapabilities(): AgentCapabilities {
    return {
      supportedTaskTypes: ['standard'],
      supportedFormTypes: [
        'multi-step',
        'conditional',
        'survey',
        'application',
        'registration',
        'feedback',
        'contact',
        'wizard',
        'assessment',
        'onboarding',
      ],
      maxComplexity: 'high',
      requiresLLM: true,
      estimatedExecutionTime: 10000, // 10 seconds
    };
  }

  protected async executeTask(task: AgentTask): Promise<AgentResult> {
    this.logger.info(`Executing standard form generation task: ${task.id}`);

    try {
      // Step 1: Analyze the prompt and determine form type
      const formAnalysis = await this.analyzeFormRequirements(task.prompt);

      // Step 2: Generate enhanced system prompt
      const systemPrompt = await this.generateSystemPrompt(
        formAnalysis,
        task.context
      );

      // Step 3: Generate form using LLM
      const formJson = await this.generateFormWithLLM(
        systemPrompt,
        task.prompt
      );

      // Step 4: Validate and assess form quality
      const qualityReport = await this.formQualityAssessor.assessForm(formJson);

      // Step 5: Optimize form based on quality assessment
      const optimizedForm = await this.optimizeForm(formJson, qualityReport);

      // Step 6: Generate final result
      return {
        success: true,
        data: {
          formJson: optimizedForm,
          qualityReport,
          formAnalysis,
          optimizations: qualityReport.suggestions,
        },
        metadata: {
          executionTime: Date.now(),
          timestamp: Date.now(),
          confidence: qualityReport.overallScore,
        },
      };
    } catch (error) {
      this.logger.error('Standard agent task execution failed', error as Error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Form generation failed',
        metadata: {
          executionTime: Date.now(),
          timestamp: Date.now(),
        },
      };
    }
  }

  protected async validateTask(task: AgentTask): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate prompt length and content
    if (task.prompt.length < 10) {
      errors.push(
        'Prompt is too short. Please provide more details about the form you want to create.'
      );
    }

    if (task.prompt.length > 2000) {
      warnings.push(
        'Prompt is very long. Consider breaking it into smaller, more focused requests.'
      );
    }

    // Check for form type indicators
    const formType = this.detectFormType(task.prompt);
    if (!formType) {
      suggestions.push(
        'Consider specifying the type of form (e.g., "survey", "application", "contact form") for better results.'
      );
    }

    // Validate context
    if (!task.context.formJson && task.context.sessionId) {
      suggestions.push(
        'Providing existing form context would help generate more consistent results.'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  protected async onInitialize(): Promise<void> {
    this.logger.info('Standard agent initializing...');

    // Initialize form quality assessor
    await this.formQualityAssessor.initialize();

    this.logger.info('Standard agent initialized successfully');
  }

  protected async onCleanup(): Promise<void> {
    this.logger.info('Standard agent cleaning up...');

    // Cleanup resources
    // No cleanup needed for promptTemplateManager as it's stateless

    this.logger.info('Standard agent cleaned up');
  }

  protected async checkHealth(): Promise<{
    isHealthy: boolean;
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      // Check LLM service availability
      if (!this.llmService) {
        return {
          isHealthy: false,
          status: 'unhealthy',
          details: { error: 'LLM service not available' },
        };
      }

      // Check form quality assessor
      const assessorHealth = await this.formQualityAssessor.checkHealth();

      return {
        isHealthy: assessorHealth.isHealthy,
        status: assessorHealth.isHealthy ? 'healthy' : 'degraded',
        details: {
          llmService: 'available',
          qualityAssessor: assessorHealth,
          promptTemplates: this.promptTemplateManager.getAllTemplates().length,
        },
      };
    } catch (error) {
      return {
        isHealthy: false,
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Analyze form requirements from the prompt
   */
  private async analyzeFormRequirements(prompt: string): Promise<FormAnalysis> {
    const formType = this.detectFormType(prompt);
    const complexity = this.assessComplexity(prompt);
    const features = this.extractFeatures(prompt);
    const targetAudience = this.identifyTargetAudience(prompt);

    return {
      formType,
      complexity,
      features,
      targetAudience,
      estimatedPages: this.estimatePageCount(complexity, features),
      requiresConditionalLogic:
        features.includes('conditional') || features.includes('branching'),
      requiresValidation:
        features.includes('validation') || features.includes('required'),
    };
  }

  /**
   * Generate enhanced system prompt based on analysis
   */
  private async generateSystemPrompt(
    analysis: FormAnalysis,
    context: any
  ): Promise<string> {
    const template = this.promptTemplateManager.getTemplate(
      analysis.formType || 'survey'
    );
    const basePrompt =
      template?.template ||
      this.promptTemplateManager.getTemplate('survey')!.template;

    // Enhance with analysis results using PromptTemplateUtils
    const enhancedPrompt = PromptTemplateUtils.enhanceTemplate(basePrompt, {
      complexity: analysis.complexity,
      features: analysis.features,
      targetAudience: analysis.targetAudience || undefined,
      accessibilityLevel: context.userPreferences?.accessibilityLevel,
    });

    return enhancedPrompt;
  }

  /**
   * Generate form using LLM with enhanced prompt
   */
  private async generateFormWithLLM(
    systemPrompt: string,
    userPrompt: string
  ): Promise<any> {
    const fullPrompt = `${systemPrompt}\n\nUser Request: ${userPrompt}`;

    const response = await this.callLLM(fullPrompt, {
      temperature: 0.7,
      maxTokens: 4000,
    });

    try {
      // Parse JSON response
      const formJson = JSON.parse(response);
      return formJson;
    } catch (error) {
      // If JSON parsing fails, try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Failed to parse form JSON from LLM response');
    }
  }

  /**
   * Optimize form based on quality assessment
   */
  private async optimizeForm(
    formJson: any,
    qualityReport: QualityReport
  ): Promise<any> {
    let optimizedForm = { ...formJson };

    // Apply optimizations based on quality report
    for (const suggestion of qualityReport.suggestions) {
      switch (suggestion.type) {
        case 'accessibility':
          optimizedForm = await this.applyAccessibilityOptimizations(
            optimizedForm,
            suggestion
          );
          break;
        case 'ux':
          optimizedForm = await this.applyUXOptimizations(
            optimizedForm,
            suggestion
          );
          break;
        case 'performance':
          optimizedForm = await this.applyPerformanceOptimizations(
            optimizedForm,
            suggestion
          );
          break;
        case 'validation':
          optimizedForm = await this.applyValidationOptimizations(
            optimizedForm,
            suggestion
          );
          break;
      }
    }

    return optimizedForm;
  }

  /**
   * Detect form type from prompt
   */
  private detectFormType(prompt: string): string | null {
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('survey') || lowerPrompt.includes('questionnaire'))
      return 'survey';
    if (lowerPrompt.includes('application') || lowerPrompt.includes('apply'))
      return 'application';
    if (lowerPrompt.includes('registration') || lowerPrompt.includes('sign up'))
      return 'registration';
    if (lowerPrompt.includes('contact') || lowerPrompt.includes('reach out'))
      return 'contact';
    if (lowerPrompt.includes('feedback') || lowerPrompt.includes('review'))
      return 'feedback';
    if (lowerPrompt.includes('wizard') || lowerPrompt.includes('step-by-step'))
      return 'wizard';
    if (lowerPrompt.includes('assessment') || lowerPrompt.includes('test'))
      return 'assessment';
    if (lowerPrompt.includes('onboarding') || lowerPrompt.includes('welcome'))
      return 'onboarding';

    return null;
  }

  /**
   * Assess form complexity
   */
  private assessComplexity(prompt: string): 'low' | 'medium' | 'high' {
    const lowerPrompt = prompt.toLowerCase();
    let complexity = 0;

    // Count complexity indicators
    if (lowerPrompt.includes('multi-step') || lowerPrompt.includes('wizard'))
      complexity += 2;
    if (
      lowerPrompt.includes('conditional') ||
      lowerPrompt.includes('branching')
    )
      complexity += 2;
    if (lowerPrompt.includes('validation') || lowerPrompt.includes('required'))
      complexity += 1;
    if (lowerPrompt.includes('complex') || lowerPrompt.includes('advanced'))
      complexity += 2;
    if (lowerPrompt.includes('simple') || lowerPrompt.includes('basic'))
      complexity -= 1;

    if (complexity <= 1) return 'low';
    if (complexity <= 3) return 'medium';
    return 'high';
  }

  /**
   * Extract features from prompt
   */
  private extractFeatures(prompt: string): string[] {
    const lowerPrompt = prompt.toLowerCase();
    const features: string[] = [];

    if (lowerPrompt.includes('conditional') || lowerPrompt.includes('if'))
      features.push('conditional');
    if (lowerPrompt.includes('validation') || lowerPrompt.includes('required'))
      features.push('validation');
    if (lowerPrompt.includes('multi-step') || lowerPrompt.includes('wizard'))
      features.push('multi-step');
    if (
      lowerPrompt.includes('file upload') ||
      lowerPrompt.includes('attachment')
    )
      features.push('file-upload');
    if (lowerPrompt.includes('payment') || lowerPrompt.includes('billing'))
      features.push('payment');
    if (lowerPrompt.includes('calendar') || lowerPrompt.includes('schedule'))
      features.push('scheduling');

    return features;
  }

  /**
   * Identify target audience
   */
  private identifyTargetAudience(prompt: string): string | null {
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('customer') || lowerPrompt.includes('client'))
      return 'customers';
    if (lowerPrompt.includes('employee') || lowerPrompt.includes('staff'))
      return 'employees';
    if (lowerPrompt.includes('student') || lowerPrompt.includes('learner'))
      return 'students';
    if (lowerPrompt.includes('patient') || lowerPrompt.includes('medical'))
      return 'patients';
    if (lowerPrompt.includes('user') || lowerPrompt.includes('visitor'))
      return 'users';

    return null;
  }

  /**
   * Estimate page count based on complexity and features
   */
  private estimatePageCount(complexity: string, features: string[]): number {
    let pages = 1;

    if (complexity === 'high') pages += 2;
    if (complexity === 'medium') pages += 1;
    if (features.includes('multi-step')) pages += 2;
    if (features.includes('conditional')) pages += 1;

    return Math.min(pages, 8); // Cap at 8 pages
  }

  // Optimization methods
  private async applyAccessibilityOptimizations(
    form: any,
    suggestion: any
  ): Promise<any> {
    // Apply accessibility improvements
    return form;
  }

  private async applyUXOptimizations(form: any, suggestion: any): Promise<any> {
    // Apply UX improvements
    return form;
  }

  private async applyPerformanceOptimizations(
    form: any,
    suggestion: any
  ): Promise<any> {
    // Apply performance improvements
    return form;
  }

  private async applyValidationOptimizations(
    form: any,
    suggestion: any
  ): Promise<any> {
    // Apply validation improvements
    return form;
  }
}

// Supporting interfaces
interface FormAnalysis {
  formType: string | null;
  complexity: 'low' | 'medium' | 'high';
  features: string[];
  targetAudience: string | null;
  estimatedPages: number;
  requiresConditionalLogic: boolean;
  requiresValidation: boolean;
}
