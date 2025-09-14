import { callLLMAPI, getCurrentAPIConfig } from '../llm-api';

/**
 * Abstract base class for all agents in the system
 * Provides common functionality and enforces consistent interface
 */
export abstract class BaseAgent {
  protected readonly agentName: string;
  protected readonly version: string;

  constructor(agentName: string, version = '1.0.0') {
    this.agentName = agentName;
    this.version = version;
  }

  /**
   * Get the agent's name
   */
  public getName(): string {
    return this.agentName;
  }

  /**
   * Get the agent's version
   */
  public getVersion(): string {
    return this.version;
  }

  /**
   * Get agent information
   */
  public getInfo(): { name: string; version: string; type: string } {
    return {
      name: this.agentName,
      version: this.version,
      type: this.getAgentType(),
    };
  }

  /**
   * Abstract method to get the agent type
   * Must be implemented by subclasses
   */
  protected abstract getAgentType(): string;

  /**
   * Common method to call LLM API with error handling
   */
  protected async callLLMWithErrorHandling(
    prompt: string,
    systemPrompt: string,
    customApiConfig?: any
  ): Promise<string> {
    try {
      const apiConfig = customApiConfig || getCurrentAPIConfig();

      if (!apiConfig.apiKey && !apiConfig.systemKey) {
        throw new Error(
          `No API key set for ${apiConfig.name}. Please configure it in the Settings.`
        );
      }

      return await callLLMAPI(prompt, systemPrompt, apiConfig);
    } catch (error) {
      console.error(`Error in ${this.agentName}:`, error);
      throw new Error(
        `${this.agentName} failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Common method to parse JSON responses with error handling
   */
  protected parseJsonResponse<T>(response: string, fallbackValue: T): T {
    try {
      // Handle undefined or null responses
      if (!response || typeof response !== 'string') {
        return fallbackValue;
      }

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

      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error(
        `Error parsing JSON response in ${this.agentName}:`,
        parseError
      );
      return fallbackValue;
    }
  }

  /**
   * Common method to validate required fields in an object
   */
  protected validateRequiredFields(
    obj: any,
    requiredFields: string[],
    context: string = 'object'
  ): void {
    const missingFields = requiredFields.filter(
      (field) => obj[field] === undefined || obj[field] === null
    );

    if (missingFields.length > 0) {
      throw new Error(
        `Invalid ${context}: missing required fields: ${missingFields.join(
          ', '
        )}`
      );
    }
  }

  /**
   * Common method to validate array fields
   */
  protected validateArrayField(
    value: any,
    fieldName: string,
    context: string = 'object'
  ): void {
    if (!Array.isArray(value)) {
      throw new Error(`Invalid ${context}: ${fieldName} must be array`);
    }
  }

  /**
   * Common method to validate number fields with range
   */
  protected validateNumberField(
    value: any,
    fieldName: string,
    min: number = 0,
    max: number = 1,
    context: string = 'object'
  ): void {
    if (typeof value !== 'number' || value < min || value > max) {
      throw new Error(
        `Invalid ${context}: ${fieldName} must be number between ${min} and ${max}`
      );
    }
  }

  /**
   * Common method to validate string fields
   */
  protected validateStringField(
    value: any,
    fieldName: string,
    context: string = 'object'
  ): void {
    if (typeof value !== 'string') {
      throw new Error(`Invalid ${context}: ${fieldName} must be string`);
    }
  }

  /**
   * Common method to validate boolean fields
   */
  protected validateBooleanField(
    value: any,
    fieldName: string,
    context: string = 'object'
  ): void {
    if (typeof value !== 'boolean') {
      throw new Error(`Invalid ${context}: ${fieldName} must be boolean`);
    }
  }

  /**
   * Common method to create fallback responses
   */
  protected createFallbackResponse<T>(
    fallbackValue: T,
    errorMessage: string
  ): T {
    console.warn(`${this.agentName} using fallback response: ${errorMessage}`);
    return fallbackValue;
  }

  /**
   * Common method to log agent operations
   */
  protected logOperation(operation: string, details?: any): void {
    console.log(`[${this.agentName}] ${operation}`, details || '');
  }

  /**
   * Common method to log errors
   */
  protected logError(operation: string, error: any): void {
    console.error(`[${this.agentName}] Error in ${operation}:`, error);
  }

  /**
   * Common method to measure execution time
   */
  protected async measureExecutionTime<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<{ result: T; executionTime: number }> {
    const startTime = Date.now();
    try {
      const result = await operation();
      const executionTime = Date.now() - startTime;
      this.logOperation(`${operationName} completed`, { executionTime });
      return { result, executionTime };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logError(`${operationName} failed`, error);
      throw error;
    }
  }

  /**
   * Common method to retry operations with exponential backoff
   */
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt === maxRetries - 1) {
          throw lastError;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        this.logOperation(`Retry attempt ${attempt + 1}/${maxRetries}`, {
          delay,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}
