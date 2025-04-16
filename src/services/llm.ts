import { OCIFSchema } from '../types/schema';
import { z , ZodTypeAny} from 'zod';

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { callLLMAPI, getCurrentAPIConfig } from './llm-api';
import { getSystemPrompt } from '../prompt-library/system-prompt';


interface GenerateStructuredOutputParams<T extends ZodTypeAny> {
  schema: T;
  request: string;
  temperature?: number;
}

export async function generateStructuredOutput<T extends ZodTypeAny>({
  schema,
  request,
  temperature = 1.5
  
}: GenerateStructuredOutputParams<T>,apiKey = ""): Promise<z.infer<T>> {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    apiKey: apiKey,
    temperature,
  });
  removeAdditionalProperties(schema);
  const structuredLlm = model.withStructuredOutput(schema,{
    strict:false
  });
  return await structuredLlm.invoke(request);
}

function removeAdditionalProperties(schema: any): any {
  if (schema && typeof schema === 'object') {
    delete schema.additionalProperties; // Remove from current level
    Object.values(schema).forEach(value => {
      if (typeof value === 'object') {
        removeAdditionalProperties(value); // Apply recursively to nested objects
      }
    });
  }
}

export async function generateOCIFFromPrompt(
  prompt: string,
  schema: OCIFSchema
): Promise<string> {
  const apiConfig = getCurrentAPIConfig();
  
  // Create a system message that instructs the model to generate valid OCIF JSON
  const systemMessage = getSystemPrompt(schema);

  try {
    return await callLLMAPI(prompt, systemMessage, apiConfig);
  } catch (error) {
    console.error('Error calling API:', error);
    throw error;
  }
} 