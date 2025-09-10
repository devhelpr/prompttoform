import { BaseAgent } from './base-agent';
import { PromptAnalysis } from '../../types/agent.types';

export class PromptAnalysisAgent extends BaseAgent {
  private readonly analysisPrompt = `You are an expert form analyst. Your task is to analyze user prompts to determine if they contain enough information to generate a comprehensive form.

Analyze the following prompt and determine:
1. Whether it contains sufficient information to create a complete form
2. What categories of information are missing (if any)
3. Your confidence level in the analysis
4. Specific reasoning for your assessment

Consider these key categories when analyzing:
- **Form Purpose**: What is the form trying to accomplish?
- **Target Audience**: Who will be filling out this form?
- **Required Fields**: What specific information needs to be collected?
- **Validation Rules**: What validation or constraints are needed?
- **User Flow**: Is it a single page or multi-step form?
- **Conditional Logic**: Are there any branching or conditional requirements?
- **Data Processing**: How should the form data be handled after submission?

Respond with a JSON object containing:
{
  "isComplete": boolean,
  "missingCategories": string[],
  "confidence": number (0-1),
  "reasoning": string,
  "suggestedQuestions": string[]
}

Be thorough but concise. If the prompt is incomplete, suggest 2-3 specific questions that would help gather the missing information.`;

  constructor() {
    super('PromptAnalysisAgent', '1.0.0');
  }

  protected getAgentType(): string {
    return 'analysis';
  }

  async analyzePrompt(prompt: string): Promise<PromptAnalysis> {
    return this.measureExecutionTime(async () => {
      try {
        const response = await this.callLLMWithErrorHandling(
          prompt,
          this.analysisPrompt
        );

        // Parse the JSON response
        const analysis = this.parseAnalysisResponse(response);

        // Validate the analysis
        this.validateAnalysis(analysis);

        return analysis;
      } catch (error) {
        this.logError('analyzePrompt', error);

        // Return a fallback analysis
        return this.createFallbackResponse(
          {
            isComplete: false,
            missingCategories: ['form_purpose', 'required_fields'],
            confidence: 0.1,
            reasoning:
              'Unable to analyze prompt due to API error. Proceeding with basic analysis.',
            suggestedQuestions: [
              'What is the main purpose of this form?',
              'What specific information do you need to collect?',
            ],
          },
          'API error during prompt analysis'
        );
      }
    }, 'analyzePrompt').then(({ result }) => result);
  }

  private parseAnalysisResponse(response: string): PromptAnalysis {
    const fallbackAnalysis: PromptAnalysis = {
      isComplete: false,
      missingCategories: ['form_purpose', 'required_fields'],
      confidence: 0.3,
      reasoning: 'Fallback analysis due to parsing error',
      suggestedQuestions: [
        'What is the main purpose of this form?',
        'What specific information do you need to collect?',
      ],
    };

    const parsed = this.parseJsonResponse(response, fallbackAnalysis);

    // If parsing failed and we got the fallback, try heuristic analysis
    if (parsed === fallbackAnalysis) {
      return this.fallbackAnalysis(response);
    }

    return {
      isComplete: Boolean(parsed.isComplete),
      missingCategories: Array.isArray(parsed.missingCategories)
        ? parsed.missingCategories
        : [],
      confidence:
        typeof parsed.confidence === 'number'
          ? Math.max(0, Math.min(1, parsed.confidence))
          : 0.5,
      reasoning: String(parsed.reasoning || 'No reasoning provided'),
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
        ? parsed.suggestedQuestions
        : [],
    };
  }

  private fallbackAnalysis(response: string): PromptAnalysis {
    const lowerResponse = response.toLowerCase();

    // Simple heuristics for fallback analysis
    const isComplete =
      lowerResponse.includes('complete') &&
      !lowerResponse.includes('not complete');
    const confidence = isComplete ? 0.7 : 0.3;

    const missingCategories = [];
    if (lowerResponse.includes('purpose') || lowerResponse.includes('what')) {
      missingCategories.push('form_purpose');
    }
    if (
      lowerResponse.includes('field') ||
      lowerResponse.includes('information')
    ) {
      missingCategories.push('required_fields');
    }
    if (
      lowerResponse.includes('validation') ||
      lowerResponse.includes('rule')
    ) {
      missingCategories.push('validation_rules');
    }

    return {
      isComplete,
      missingCategories,
      confidence,
      reasoning: 'Fallback analysis due to parsing error',
      suggestedQuestions: [
        'What is the main purpose of this form?',
        'What specific information do you need to collect?',
      ],
    };
  }

  private validateAnalysis(analysis: PromptAnalysis): void {
    this.validateBooleanField(analysis.isComplete, 'isComplete', 'analysis');
    this.validateArrayField(
      analysis.missingCategories,
      'missingCategories',
      'analysis'
    );
    this.validateNumberField(
      analysis.confidence,
      'confidence',
      0,
      1,
      'analysis'
    );
    this.validateStringField(analysis.reasoning, 'reasoning', 'analysis');
  }
}
