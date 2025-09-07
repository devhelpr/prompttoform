import { callLLMAPI, getCurrentAPIConfig } from '../llm-api';
import {
  AgentQuestion,
  PromptAnalysis,
  ConversationMessage,
} from '../../types/agent.types';

export class QuestionGenerationAgent {
  private readonly questionPrompt = `You are an expert form designer and user experience specialist. Your task is to generate specific, actionable questions to help users provide missing information for form creation.

Based on the analysis and conversation history, generate 1-3 targeted questions that will help gather the missing information needed to create a comprehensive form.

Guidelines for question generation:
1. **Be Specific**: Ask for concrete details, not vague concepts
2. **Be Actionable**: Questions should lead to clear, implementable answers
3. **Avoid Redundancy**: Don't ask for information already provided
4. **Consider Context**: Build on previous answers and conversation flow
5. **Use Appropriate Input Types**: Choose the right input type for each question

Input Types:
- **text**: For short, specific answers (names, titles, single concepts)
- **textarea**: For longer explanations or detailed descriptions
- **select**: For choosing from predefined options
- **multiselect**: For choosing multiple options from a list

Respond with a JSON array of question objects:
[
  {
    "id": "unique_question_id",
    "question": "Clear, specific question text",
    "category": "category_name",
    "inputType": "text|textarea|select|multiselect",
    "options": ["option1", "option2"] (only for select/multiselect),
    "required": true|false,
    "placeholder": "Helpful placeholder text",
    "helpText": "Additional context or examples"
  }
]

Focus on the most critical missing information first. Generate questions that will significantly improve the form quality.`;

  async generateQuestions(
    analysis: PromptAnalysis,
    conversationHistory: ConversationMessage[] = []
  ): Promise<AgentQuestion[]> {
    try {
      const apiConfig = getCurrentAPIConfig();

      if (!apiConfig.apiKey && !apiConfig.systemKey) {
        throw new Error(
          `No API key set for ${apiConfig.name}. Please configure it in the Settings.`
        );
      }

      // Build context from conversation history
      const context = this.buildConversationContext(conversationHistory);

      const prompt = this.buildQuestionPrompt(analysis, context);

      const response = await callLLMAPI(prompt, this.questionPrompt, apiConfig);

      const questions = this.parseQuestionsResponse(response);

      // Validate and enhance questions
      return this.validateAndEnhanceQuestions(questions);
    } catch (error) {
      console.error('Error generating questions:', error);

      // Return fallback questions based on missing categories
      return this.generateFallbackQuestions(analysis);
    }
  }

  private buildConversationContext(
    conversationHistory: ConversationMessage[]
  ): string {
    if (conversationHistory.length === 0) {
      return 'No previous conversation history.';
    }

    const recentMessages = conversationHistory.slice(-6); // Last 6 messages for context

    return recentMessages
      .map((msg) => {
        const role = msg.type === 'user' ? 'User' : 'Agent';
        return `${role}: ${msg.content}`;
      })
      .join('\n');
  }

  private buildQuestionPrompt(
    analysis: PromptAnalysis,
    context: string
  ): string {
    return `Analysis Results:
- Complete: ${analysis.isComplete}
- Missing Categories: ${analysis.missingCategories.join(', ')}
- Confidence: ${analysis.confidence}
- Reasoning: ${analysis.reasoning}

Conversation Context:
${context}

Generate specific questions to gather the missing information. Focus on the most critical gaps first.`;
  }

  private parseQuestionsResponse(response: string): AgentQuestion[] {
    try {
      // Try to extract JSON from the response
      let jsonString = response.trim();

      // Remove markdown code blocks if present
      if (jsonString.includes('```')) {
        const codeBlockMatch = jsonString.match(
          /```(?:json)?\s*([\s\S]*?)\s*```/
        );
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1].trim();
        }
      }

      const parsed = JSON.parse(jsonString);

      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      return parsed.map((q: any, index: number) => ({
        id: q.id || `question_${index + 1}`,
        question: String(q.question || ''),
        category: String(q.category || 'general'),
        inputType: this.validateInputType(q.inputType),
        options: Array.isArray(q.options) ? q.options : undefined,
        required: Boolean(q.required),
        placeholder: String(q.placeholder || ''),
        helpText: String(q.helpText || ''),
      }));
    } catch (parseError) {
      console.error('Error parsing questions response:', parseError);
      throw new Error('Failed to parse questions response');
    }
  }

  private validateInputType(
    inputType: any
  ): 'text' | 'textarea' | 'select' | 'multiselect' {
    const validTypes = ['text', 'textarea', 'select', 'multiselect'];
    return validTypes.includes(inputType) ? inputType : 'text';
  }

  private validateAndEnhanceQuestions(
    questions: AgentQuestion[]
  ): AgentQuestion[] {
    return questions.map((question, index) => ({
      ...question,
      id: question.id || `question_${index + 1}`,
      required: question.required !== false, // Default to required
      placeholder: question.placeholder || this.generatePlaceholder(question),
      helpText: question.helpText || this.generateHelpText(question),
    }));
  }

  private generatePlaceholder(question: AgentQuestion): string {
    switch (question.inputType) {
      case 'text':
        return 'Enter your answer...';
      case 'textarea':
        return 'Provide a detailed answer...';
      case 'select':
        return 'Choose an option...';
      case 'multiselect':
        return 'Select one or more options...';
      default:
        return 'Enter your answer...';
    }
  }

  private generateHelpText(question: AgentQuestion): string {
    if (question.category === 'form_purpose') {
      return 'Describe what this form is meant to accomplish or what problem it solves.';
    }
    if (question.category === 'required_fields') {
      return 'List the specific information you need to collect from users.';
    }
    if (question.category === 'validation_rules') {
      return 'Specify any validation requirements or constraints for the form fields.';
    }
    if (question.category === 'user_flow') {
      return 'Describe how users should navigate through the form (single page, multi-step, etc.).';
    }
    return 'Provide as much detail as possible to help create the best form for your needs.';
  }

  private generateFallbackQuestions(analysis: PromptAnalysis): AgentQuestion[] {
    const questions: AgentQuestion[] = [];

    if (analysis.missingCategories.includes('form_purpose')) {
      questions.push({
        id: 'purpose_question',
        question: 'What is the main purpose of this form?',
        category: 'form_purpose',
        inputType: 'textarea',
        required: true,
        placeholder: 'Describe what this form is meant to accomplish...',
        helpText:
          'Explain what problem this form solves or what goal it helps achieve.',
      });
    }

    if (analysis.missingCategories.includes('required_fields')) {
      questions.push({
        id: 'fields_question',
        question: 'What specific information do you need to collect?',
        category: 'required_fields',
        inputType: 'textarea',
        required: true,
        placeholder:
          'List the fields you need (e.g., name, email, phone, etc.)...',
        helpText: 'Be specific about what data you need to collect from users.',
      });
    }

    if (analysis.missingCategories.includes('validation_rules')) {
      questions.push({
        id: 'validation_question',
        question: 'Are there any validation requirements or constraints?',
        category: 'validation_rules',
        inputType: 'textarea',
        required: false,
        placeholder:
          'Describe any validation rules (e.g., email format, required fields, etc.)...',
        helpText: 'Specify any rules for validating user input.',
      });
    }

    // If no specific categories, ask a general question
    if (questions.length === 0) {
      questions.push({
        id: 'general_question',
        question:
          'Can you provide more details about what you want this form to do?',
        category: 'general',
        inputType: 'textarea',
        required: true,
        placeholder: 'Provide more specific details...',
        helpText:
          'The more details you provide, the better we can create your form.',
      });
    }

    return questions;
  }
}
