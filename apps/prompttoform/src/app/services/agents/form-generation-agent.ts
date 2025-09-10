import { BaseAgent } from './base-agent';
import { FormGenerationService } from '../form-generation.service';
import { UISchema } from '../../types/ui-schema';
import {
  ConversationState,
  FormGenerationContext,
} from '../../types/agent.types';
import { FormGenerationResult } from '../form-generation.service';

export class FormGenerationAgent extends BaseAgent {
  private formGenerationService: FormGenerationService;

  constructor(uiSchema: UISchema, skipValidation = true) {
    super('FormGenerationAgent', '1.0.0');
    this.formGenerationService = new FormGenerationService(
      uiSchema,
      skipValidation
    );
  }

  protected getAgentType(): string {
    return 'form-generation';
  }

  async generateFormFromConversation(
    conversationState: ConversationState,
    onProgress?: (progress: any) => void
  ): Promise<FormGenerationResult> {
    return this.measureExecutionTime(async () => {
      try {
        // Debug: Log the conversation state received
        this.logOperation('generateFormFromConversation', {
          totalMessages: conversationState.messages.length,
          messages: conversationState.messages.map((m) => ({
            id: m.id,
            type: m.type,
            content: m.content,
            timestamp: m.timestamp,
          })),
          userMessages: conversationState.messages
            .filter((m) => m.type === 'user')
            .map((m) => ({
              id: m.id,
              content: m.content,
              timestamp: m.timestamp,
            })),
        });

        // Build the enhanced prompt from conversation
        const enhancedPrompt = this.buildEnhancedPrompt(conversationState);

        // Generate the form using the existing service
        const result = await this.formGenerationService.generateForm(
          enhancedPrompt,
          onProgress
        );

        // Add conversation context to the result
        if (result.success) {
          result.conversationContext = {
            originalPrompt: this.getOriginalPrompt(conversationState),
            conversationHistory: conversationState.messages,
            gatheredInformation: conversationState.context,
            analysis: conversationState.analysis || {
              isComplete: false,
              missingCategories: [],
              confidence: 0,
              reasoning: 'No analysis available',
              suggestedQuestions: [],
            },
          };
        }

        return result;
      } catch (error) {
        this.logError('generateFormFromConversation', error);
        return {
          success: false,
          error: `Failed to generate form from conversation: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        };
      }
    }, 'generateFormFromConversation').then(({ result }) => result);
  }

  async generateFormFromContext(
    context: FormGenerationContext
  ): Promise<FormGenerationResult> {
    return this.measureExecutionTime(async () => {
      try {
        // Build prompt from context
        const prompt = this.buildPromptFromContext(context);

        // Generate the form
        const result = await this.formGenerationService.generateForm(prompt);

        // Add context to result
        if (result.success) {
          result.conversationContext = context;
        }

        return result;
      } catch (error) {
        this.logError('generateFormFromContext', error);
        return {
          success: false,
          error: `Failed to generate form from context: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        };
      }
    }, 'generateFormFromContext').then(({ result }) => result);
  }

  private buildEnhancedPrompt(conversationState: ConversationState): string {
    const originalPrompt = this.getOriginalPrompt(conversationState);
    const gatheredInfo = this.formatGatheredInformation(
      conversationState.context
    );
    const analysis = conversationState.analysis;

    let enhancedPrompt = originalPrompt;

    if (gatheredInfo) {
      enhancedPrompt += `\n\nAdditional Requirements and Information:\n${gatheredInfo}`;
    }

    if (analysis && !analysis.isComplete) {
      enhancedPrompt += `\n\nNote: Some information may be incomplete. Please make reasonable assumptions where needed and create a functional form.`;
    }

    // Log the enhanced prompt for debugging
    this.logOperation('buildEnhancedPrompt', {
      originalPrompt,
      gatheredInfo,
      contextKeys: Object.keys(conversationState.context),
      enhancedPrompt,
    });

    return enhancedPrompt;
  }

  private buildPromptFromContext(context: FormGenerationContext): string {
    let prompt = context.originalPrompt;

    if (Object.keys(context.gatheredInformation).length > 0) {
      const gatheredInfo = this.formatGatheredInformation(
        context.gatheredInformation
      );
      prompt += `\n\nAdditional Requirements:\n${gatheredInfo}`;
    }

    if (context.analysis && !context.analysis.isComplete) {
      prompt += `\n\nNote: Some information may be incomplete. Please make reasonable assumptions where needed.`;
    }

    return prompt;
  }

  private getOriginalPrompt(conversationState: ConversationState): string {
    // Get all user messages and sort by timestamp to find the earliest one
    const userMessages = conversationState.messages.filter(
      (m) => m.type === 'user'
    );

    // Debug: Log the raw timestamps before sorting
    this.logOperation('getOriginalPrompt - raw messages', {
      userMessages: userMessages.map((m) => ({
        id: m.id,
        content: m.content,
        timestamp: m.timestamp,
        timestampMs: new Date(m.timestamp).getTime(),
      })),
    });

    const sortedUserMessages = userMessages.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Debug: Log the sorted messages
    this.logOperation('getOriginalPrompt - sorted messages', {
      sortedMessages: sortedUserMessages.map((m) => ({
        id: m.id,
        content: m.content,
        timestamp: m.timestamp,
        timestampMs: new Date(m.timestamp).getTime(),
      })),
    });

    const firstUserMessage = sortedUserMessages[0];

    // Debug logging to see what's in the conversation state
    this.logOperation('getOriginalPrompt debug', {
      totalMessages: conversationState.messages.length,
      allMessages: conversationState.messages.map((m) => ({
        id: m.id,
        type: m.type,
        content: m.content,
        timestamp: m.timestamp,
      })),
      userMessages: userMessages.map((m) => ({
        id: m.id,
        content: m.content,
        timestamp: m.timestamp,
      })),
      firstUserMessage: firstUserMessage
        ? {
            id: firstUserMessage.id,
            content: firstUserMessage.content,
            timestamp: firstUserMessage.timestamp,
          }
        : null,
    });

    return firstUserMessage?.content || '';
  }

  private formatGatheredInformation(context: Record<string, any>): string {
    return Object.entries(context)
      .map(([key, value]) => {
        // Format the key to be more readable
        const formattedKey = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

        return `${formattedKey}: ${value}`;
      })
      .join('\n');
  }

  // Delegate other methods to the underlying service
  async updateForm(
    currentForm: string,
    updatePrompt: string,
    sessionId?: string
  ): Promise<FormGenerationResult> {
    return this.formGenerationService.updateForm(
      currentForm,
      updatePrompt,
      sessionId
    );
  }

  // Note: validateFormSchema is private in FormGenerationService
  // Use the service directly if validation is needed
}

// Extend the FormGenerationResult interface to include conversation context
declare module '../form-generation.service' {
  interface FormGenerationResult {
    conversationContext?: FormGenerationContext;
  }
}
