/**
 * Core types and interfaces for the agent system
 */

export interface PromptAnalysis {
  isComplete: boolean;
  missingCategories: string[];
  confidence: number;
  reasoning: string;
  suggestedQuestions?: string[];
}

export interface AgentQuestion {
  id: string;
  question: string;
  category: string;
  inputType: 'text' | 'select' | 'multiselect' | 'textarea';
  options?: string[];
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

export interface ConversationMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    questionId?: string;
    category?: string;
    isQuestion?: boolean;
  };
}

export interface ConversationState {
  messages: ConversationMessage[];
  currentQuestions: AgentQuestion[];
  context: Record<string, any>;
  isComplete: boolean;
  analysis?: PromptAnalysis;
  sessionId?: string;
}

export interface AgentResponse {
  type: 'analysis' | 'questions' | 'complete' | 'error';
  data: PromptAnalysis | AgentQuestion[] | string | Error;
  nextAction?: 'wait_for_response' | 'generate_form' | 'ask_more_questions';
}

export interface AgentConfig {
  maxQuestions: number;
  confidenceThreshold: number;
  enableFallback: boolean;
  timeoutMs: number;
}

export interface FormGenerationContext {
  originalPrompt: string;
  conversationHistory: ConversationMessage[];
  gatheredInformation: Record<string, any>;
  analysis: PromptAnalysis;
}
