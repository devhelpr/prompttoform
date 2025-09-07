import { callLLMAPI, getCurrentAPIConfig } from '../llm-api';
import { PromptAnalysis } from '../../types/agent.types';

export class PromptAnalysisAgent {
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

  async analyzePrompt(prompt: string): Promise<PromptAnalysis> {
    try {
      const apiConfig = getCurrentAPIConfig();

      if (!apiConfig.apiKey && !apiConfig.systemKey) {
        throw new Error(
          `No API key set for ${apiConfig.name}. Please configure it in the Settings.`
        );
      }

      const response = await callLLMAPI(prompt, this.analysisPrompt, apiConfig);

      // Parse the JSON response
      const analysis = this.parseAnalysisResponse(response);

      // Validate the analysis
      this.validateAnalysis(analysis);

      return analysis;
    } catch (error) {
      console.error('Error analyzing prompt:', error);

      // Return a fallback analysis
      return {
        isComplete: false,
        missingCategories: ['form_purpose', 'required_fields'],
        confidence: 0.1,
        reasoning:
          'Unable to analyze prompt due to API error. Proceeding with basic analysis.',
        suggestedQuestions: [
          'What is the main purpose of this form?',
          'What specific information do you need to collect?',
        ],
      };
    }
  }

  private parseAnalysisResponse(response: string): PromptAnalysis {
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
    } catch (parseError) {
      console.error('Error parsing analysis response:', parseError);

      // Fallback parsing - try to extract information from text
      return this.fallbackAnalysis(response);
    }
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
    if (typeof analysis.isComplete !== 'boolean') {
      throw new Error('Invalid analysis: isComplete must be boolean');
    }

    if (!Array.isArray(analysis.missingCategories)) {
      throw new Error('Invalid analysis: missingCategories must be array');
    }

    if (
      typeof analysis.confidence !== 'number' ||
      analysis.confidence < 0 ||
      analysis.confidence > 1
    ) {
      throw new Error(
        'Invalid analysis: confidence must be number between 0 and 1'
      );
    }

    if (typeof analysis.reasoning !== 'string') {
      throw new Error('Invalid analysis: reasoning must be string');
    }
  }
}
