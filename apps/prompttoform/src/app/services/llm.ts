import { UISchema } from '../types/ui-schema';
import { z, ZodTypeAny } from 'zod';

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { callLLMAPI, getCurrentAPIConfig } from './llm-api';
import {
  getSystemPrompt,
  getUpdateFormPrompt,
} from '../prompt-library/system-prompt';

interface GenerateStructuredOutputParams<T extends ZodTypeAny> {
  schema: T;
  request: string;
  temperature?: number;
}

export async function generateStructuredOutput<T extends ZodTypeAny>(
  { schema, request, temperature = 1.5 }: GenerateStructuredOutputParams<T>,
  apiKey = ''
): Promise<z.infer<T>> {
  const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.0-flash',
    apiKey: apiKey,
    temperature,
  });
  const schemaObj = schema as unknown as Record<string, unknown>;
  removeAdditionalProperties(schemaObj);
  const structuredLlm = model.withStructuredOutput(schema, {
    strict: false,
  });
  return await structuredLlm.invoke(request);
}

function removeAdditionalProperties(
  schema: Record<string, unknown>
): Record<string, unknown> {
  if (schema && typeof schema === 'object') {
    delete schema.additionalProperties; // Remove from current level
    Object.values(schema).forEach((value) => {
      if (typeof value === 'object' && value !== null) {
        removeAdditionalProperties(value as Record<string, unknown>); // Apply recursively to nested objects
      }
    });
  }
  return schema;
}

export async function generateUIFromPrompt(
  prompt: string,
  uiSchema: UISchema
): Promise<string> {
  const apiConfig = getCurrentAPIConfig();

  // Create a system message that instructs the model to generate valid UI JSON
  const systemMessage = getSystemPrompt(uiSchema);

  try {
    return await callLLMAPI(prompt, systemMessage, apiConfig, uiSchema);
  } catch (error) {
    console.error('Error calling API:', error);
    throw error;
  }
}

export async function updateFormWithPatch(
  currentForm: string,
  updatePrompt: string
): Promise<string> {
  const apiConfig = getCurrentAPIConfig();
  const systemMessage = getUpdateFormPrompt();

  const fullPrompt = `Current form definition:
${currentForm}

Requested changes:
${updatePrompt}

Generate a JSON patch document to update the form according to the requested changes.`;

  try {
    const response = await callLLMAPI(fullPrompt, systemMessage, apiConfig);

    // For patch responses, we need to handle the JSON more carefully
    // because it might contain escaped characters that need special handling
    console.log('Raw patch response:', response);

    // Try to clean the response manually for patch operations
    let cleanedResponse = response;

    // Remove markdown code blocks if present
    if (response.includes('```')) {
      const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        cleanedResponse = codeBlockMatch[1].trim();
      }
    }

    // Try to parse it to validate it's valid JSON
    try {
      JSON.parse(cleanedResponse);
      console.log('Patch response is valid JSON');
      return cleanedResponse;
    } catch (parseError) {
      console.error('Failed to parse patch response as JSON:', parseError);
      console.log('Attempting to fix common JSON issues...');

      // Try to fix common issues with escaped characters
      let fixedResponse = cleanedResponse;

      // Fix double-escaped characters
      fixedResponse = fixedResponse
        .replace(/\\\\n/g, '\\n')
        .replace(/\\\\r/g, '\\r')
        .replace(/\\\\t/g, '\\t')
        .replace(/\\\\"/g, '\\"')
        .replace(/\\\\/g, '\\');

      // Try parsing again
      try {
        JSON.parse(fixedResponse);
        console.log('Successfully fixed patch response');
        return fixedResponse;
      } catch (secondError) {
        console.error('Still failed to parse after fixing:', secondError);
        const errorMessage =
          secondError instanceof Error
            ? secondError.message
            : String(secondError);
        throw new Error(`Invalid JSON patch response: ${errorMessage}`);
      }
    }
  } catch (error) {
    console.error('Error generating form update:', error);
    throw error;
  }
}
