import {
  ConversationState,
  ConversationMessage,
  AgentQuestion,
  PromptAnalysis,
} from '../../types/agent.types';
import {
  MultiLanguageAnalysis,
  TranslationResult,
  MultiLanguageAgentState,
} from '../../types/multi-language-agent.types';
import { PromptAnalysisAgent } from './prompt-analysis-agent';
import { QuestionGenerationAgent } from './question-generation-agent';
import { MultiLanguageDetectionAgent } from './multi-language-detection-agent';
import { TranslationGenerationAgent } from './translation-generation-agent';

export class ConversationManager {
  private analysisAgent: PromptAnalysisAgent;
  private questionAgent: QuestionGenerationAgent;
  private multiLangAgent: MultiLanguageDetectionAgent;
  private translationAgent: TranslationGenerationAgent;
  private state: ConversationState & MultiLanguageAgentState;

  constructor() {
    this.analysisAgent = new PromptAnalysisAgent();
    this.questionAgent = new QuestionGenerationAgent();
    this.multiLangAgent = new MultiLanguageDetectionAgent({
      confidenceThreshold: 0.7,
      enableFallback: true,
      maxLanguages: 5,
      supportedLanguageCodes: [
        'en',
        'es',
        'fr',
        'de',
        'it',
        'pt',
        'zh',
        'ja',
        'ko',
        'ar',
        'hi',
        'ru',
        'nl',
        'sv',
        'da',
        'no',
        'fi',
        'pl',
        'tr',
        'he',
        'th',
        'vi',
        'id',
        'ms',
        'tl',
        'uk',
        'cs',
        'hu',
        'ro',
        'bg',
        'hr',
        'sk',
        'sl',
        'et',
        'lv',
        'lt',
        'el',
        'is',
        'mt',
        'cy',
        'ga',
        'eu',
        'ca',
        'gl',
      ],
    });
    this.translationAgent = new TranslationGenerationAgent({
      enableLLMTranslation: true,
      fallbackToEnglish: true,
      preserveFormatting: true,
      maxRetries: 3,
      timeoutMs: 30000,
    });
    this.state = this.initializeState();
  }

  private initializeState(): ConversationState & MultiLanguageAgentState {
    return {
      messages: [],
      currentQuestions: [],
      context: {},
      isComplete: false,
      sessionId: this.generateSessionId(),
      // Multi-language state
      currentLanguage: 'en',
      availableLanguages: ['en'],
    };
  }

  async startConversation(
    initialPrompt: string
  ): Promise<ConversationState & MultiLanguageAgentState> {
    try {
      // Reset state for new conversation
      this.state = this.initializeState();

      // Add initial user message
      this.addMessage('user', initialPrompt);

      // Analyze the initial prompt
      const analysis = await this.analysisAgent.analyzePrompt(initialPrompt);
      this.state.analysis = analysis;

      // Detect multi-language requirements
      try {
        const multiLangAnalysis =
          await this.multiLangAgent.detectMultiLanguageRequest(initialPrompt);
        this.state.multiLanguageAnalysis = multiLangAnalysis;
        this.state.availableLanguages = multiLangAnalysis.requestedLanguages;
        this.state.languageDetails = multiLangAnalysis.languageDetails;
      } catch (error) {
        console.error('Error in multi-language detection:', error);
        // Continue without multi-language support
      }

      // Add analysis message
      this.addMessage(
        'agent',
        `I've analyzed your request. ${analysis.reasoning}`
      );

      if (analysis.isComplete && analysis.confidence > 0.7) {
        // Prompt is complete, ready for form generation
        this.state.isComplete = true;
        this.addMessage(
          'agent',
          'Your prompt contains sufficient information to generate a form. Ready to proceed!'
        );
      } else {
        // Generate questions to gather missing information
        const questions = await this.questionAgent.generateQuestions(
          analysis,
          this.state.messages
        );
        this.state.currentQuestions = questions;

        // Add questions as agent messages
        questions.forEach((question) => {
          this.addMessage('agent', question.question, {
            questionId: question.id,
            category: question.category,
            isQuestion: true,
          });
        });
      }

      return this.state;
    } catch (error) {
      console.error('Error starting conversation:', error);
      this.addMessage(
        'system',
        'Sorry, I encountered an error analyzing your prompt. Please try again.'
      );
      return this.state;
    }
  }

  async processUserResponse(
    response: string,
    questionId?: string
  ): Promise<ConversationState> {
    try {
      // Add user response
      this.addMessage('user', response);

      // Store the response in context
      if (questionId) {
        this.state.context[questionId] = response;
      }

      // Remove the answered question from current questions
      if (questionId) {
        this.state.currentQuestions = this.state.currentQuestions.filter(
          (q) => q.id !== questionId
        );
      }

      // Check if we have enough information now
      if (this.state.currentQuestions.length === 0) {
        // All questions answered, re-analyze with new information
        const updatedPrompt = this.buildUpdatedPrompt();
        const analysis = await this.analysisAgent.analyzePrompt(updatedPrompt);
        this.state.analysis = analysis;

        if (analysis.isComplete && analysis.confidence > 0.7) {
          this.state.isComplete = true;
          this.addMessage(
            'agent',
            'Perfect! I now have enough information to generate your form. Ready to proceed!'
          );
        } else {
          // Generate more questions if still incomplete
          const newQuestions = await this.questionAgent.generateQuestions(
            analysis,
            this.state.messages
          );
          this.state.currentQuestions = newQuestions;

          if (newQuestions.length > 0) {
            newQuestions.forEach((question) => {
              this.addMessage('agent', question.question, {
                questionId: question.id,
                category: question.category,
                isQuestion: true,
              });
            });
          } else {
            this.addMessage(
              'agent',
              'I have enough information to proceed with form generation, though some details might be estimated.'
            );
            this.state.isComplete = true;
          }
        }
      }

      return this.state;
    } catch (error) {
      console.error('Error processing user response:', error);
      this.addMessage(
        'system',
        'Sorry, I encountered an error processing your response. Please try again.'
      );
      return this.state;
    }
  }

  async skipToFormGeneration(): Promise<ConversationState> {
    this.state.isComplete = true;
    this.addMessage(
      'agent',
      'Skipping to form generation with the information provided so far.'
    );
    return this.state;
  }

  getCurrentState(): ConversationState {
    return { ...this.state };
  }

  getConversationHistory(): ConversationMessage[] {
    return [...this.state.messages];
  }

  getCurrentQuestions(): AgentQuestion[] {
    return [...this.state.currentQuestions];
  }

  isConversationComplete(): boolean {
    return this.state.isComplete;
  }

  getGatheredInformation(): Record<string, any> {
    return { ...this.state.context };
  }

  private addMessage(
    type: 'user' | 'agent' | 'system',
    content: string,
    metadata?: ConversationMessage['metadata']
  ): void {
    const message: ConversationMessage = {
      id: this.generateMessageId(),
      type,
      content,
      timestamp: new Date(),
      metadata,
    };

    this.state.messages.push(message);
  }

  private buildUpdatedPrompt(): string {
    const originalPrompt =
      this.state.messages.find((m) => m.type === 'user')?.content || '';
    const gatheredInfo = Object.entries(this.state.context)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    return `${originalPrompt}\n\nAdditional Information:\n${gatheredInfo}`;
  }

  private generateSessionId(): string {
    return `agent_session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Utility methods for debugging and testing
  resetConversation(): void {
    this.state = this.initializeState();
  }

  getAnalysis(): PromptAnalysis | undefined {
    return this.state.analysis;
  }

  getSessionId(): string | undefined {
    return this.state.sessionId;
  }

  // Multi-language methods
  async generateFormWithTranslations(formJson: any): Promise<any> {
    const multiLangAnalysis = this.state.multiLanguageAnalysis;

    if (!multiLangAnalysis || !multiLangAnalysis.isMultiLanguageRequested) {
      return formJson;
    }

    try {
      const translationResult =
        await this.translationAgent.generateTranslations({
          formJson,
          targetLanguages: multiLangAnalysis.requestedLanguages,
          sourceLanguage: 'en',
          languageDetails: multiLangAnalysis.languageDetails,
        });

      this.state.translationResult = translationResult;

      if (translationResult.success && translationResult.translations) {
        return {
          ...formJson,
          translations: translationResult.translations,
          defaultLanguage: 'en',
          supportedLanguages: [
            'en',
            ...multiLangAnalysis.requestedLanguages.filter(
              (lang) => lang !== 'en'
            ),
          ],
          languageDetails: multiLangAnalysis.languageDetails,
        };
      } else {
        console.error('Translation failed:', translationResult.errors);
        return formJson;
      }
    } catch (error) {
      console.error('Error generating translations:', error);
      return formJson;
    }
  }

  getMultiLanguageState(): MultiLanguageAgentState {
    return {
      multiLanguageAnalysis: this.state.multiLanguageAnalysis,
      translationResult: this.state.translationResult,
      currentLanguage: this.state.currentLanguage,
      availableLanguages: this.state.availableLanguages,
      languageDetails: this.state.languageDetails,
    };
  }

  setCurrentLanguage(language: string): void {
    if (this.state.availableLanguages.includes(language)) {
      this.state.currentLanguage = language;
    } else {
      console.warn(
        `Language ${language} is not available. Available languages:`,
        this.state.availableLanguages
      );
    }
  }

  isMultiLanguageEnabled(): boolean {
    return this.state.multiLanguageAnalysis?.isMultiLanguageRequested === true;
  }

  getAvailableLanguages(): string[] {
    return [...this.state.availableLanguages];
  }

  getCurrentLanguage(): string {
    return this.state.currentLanguage;
  }

  getLanguageDetails():
    | Array<{ code: string; name: string; nativeName: string }>
    | undefined {
    return this.state.languageDetails;
  }
}
