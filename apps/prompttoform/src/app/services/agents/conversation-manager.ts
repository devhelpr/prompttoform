import {
  ConversationState,
  ConversationMessage,
  AgentQuestion,
  PromptAnalysis,
} from '../../types/agent.types';
import { PromptAnalysisAgent } from './prompt-analysis-agent';
import { QuestionGenerationAgent } from './question-generation-agent';

export class ConversationManager {
  private analysisAgent: PromptAnalysisAgent;
  private questionAgent: QuestionGenerationAgent;
  private state: ConversationState;

  constructor() {
    this.analysisAgent = new PromptAnalysisAgent();
    this.questionAgent = new QuestionGenerationAgent();
    this.state = this.initializeState();
  }

  private initializeState(): ConversationState {
    return {
      messages: [],
      currentQuestions: [],
      context: {},
      isComplete: false,
      sessionId: this.generateSessionId(),
    };
  }

  async startConversation(initialPrompt: string): Promise<ConversationState> {
    try {
      // Reset state for new conversation
      this.state = this.initializeState();

      // Add initial user message
      this.addMessage('user', initialPrompt);

      // Analyze the initial prompt
      const analysis = await this.analysisAgent.analyzePrompt(initialPrompt);
      this.state.analysis = analysis;

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
}
