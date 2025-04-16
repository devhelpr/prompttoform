import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z, ZodTypeAny } from 'zod';
// OCIFSchemaDefinition no longer needed since we're using direct fetch for Gemini
// import { OCIFSchemaDefinition } from '../schemas/schema';

interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
}

// Gemini API response structure is different from other providers
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
  }>;
}

interface APIConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
}

interface GenerateStructuredOutputParams<T extends ZodTypeAny> {
  schema: T;
  request: string;
  temperature?: number;
}

export function getCurrentAPIConfig(): APIConfig {
  const savedSettings = localStorage.getItem('llmSettings');
  if (savedSettings) {
    const { apis, selectedAPI } = JSON.parse(savedSettings);
    const selectedConfig = apis.find((api: APIConfig) => api.name === selectedAPI);
    if (selectedConfig) {
      return selectedConfig;
    }
  }
  
  // Fallback to default OpenAI config
  return {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  };
}

export async function generateStructuredOutput<T extends ZodTypeAny>({
  schema,
  request,
  temperature = 1.5
}: GenerateStructuredOutputParams<T>, apiKey = ""): Promise<z.infer<T>> {
  try {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      apiKey: apiKey,
      temperature,
    });
    const schemaObj = schema as unknown as Record<string, unknown>;
    removeAdditionalProperties(schemaObj);
    const structuredLlm = model.withStructuredOutput(schema, {
      strict: false
    });
    return await structuredLlm.invoke(request);
  } catch (error) {
    console.error('Error in generateStructuredOutput:', error);
    // Re-throw the error with more context
    if (error instanceof Error) {
      throw new Error(`Failed to generate structured output: ${error.message}`);
    }
    throw new Error(`Failed to generate structured output: ${String(error)}`);
  }
}

function removeAdditionalProperties(schema: Record<string, unknown>): void {
  if (schema && typeof schema === 'object') {
    delete schema.additionalProperties;
    Object.values(schema).forEach(value => {
      if (typeof value === 'object' && value !== null) {
        removeAdditionalProperties(value as Record<string, unknown>);
      }
    });
  }
}

/**
 * Removes markdown code blocks (```json ... ```) from a string if present
 * @param content The string that might contain markdown code blocks
 * @returns The cleaned string with markdown code blocks removed
 */
export function removeMarkdownCodeBlocks(content: string): string {
  if (!content) return content;
  
  // Check if the entire content is a code block
  // Handle various formats like ```json\n...\n```, ```\n...\n```, etc.
  const strictCodeBlockPattern = /^\s*```(?:json|javascript|js)?\s*\n?([\s\S]*?)\n?\s*```\s*$/;
  const strictMatch = content.match(strictCodeBlockPattern);
  
  if (strictMatch && strictMatch[1]) {
    return strictMatch[1].trim();
  }
  
  // If not, try to find and extract JSON objects wrapped in {} 
  // This is a fallback for partial code blocks or non-standard formatting
  if (content.includes('{') && content.includes('}')) {
    const jsonObjectPattern = /({[\s\S]*})/;
    const jsonMatch = content.match(jsonObjectPattern);
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        // Verify it's valid JSON
        JSON.parse(jsonMatch[1]);
        return jsonMatch[1].trim();
      } catch {
        // If it's not valid JSON, continue with the original content
      }
    }
  }
  
  return content;
}

/**
 * Attempts to determine whether the prompt is requesting UI/form or diagram generation
 * @param prompt The user's prompt
 * @returns 'ui' if the prompt appears to be requesting UI/form, 'ocif' if diagram 
 */
export function detectPromptType(prompt: string): 'ui' | 'ocif' {
  // Convert to lowercase for case-insensitive matching
  const lowerPrompt = prompt.toLowerCase();
  
  // Keywords that suggest UI/form generation
  const uiKeywords = [
    'form', 'ui', 'interface', 'input', 'screen', 'page', 'website', 
    'web app', 'application', 'layout', 'dashboard', 'login', 'signup',
    'registration', 'user interface', 'button', 'field', 'validation'
  ];
  
  // Keywords that suggest diagram generation
  const diagramKeywords = [
    'diagram', 'flow', 'chart', 'graph', 'network', 'relationship', 
    'connection', 'node', 'edge', 'visual', 'map', 'hierarchy', 
    'structure', 'architecture', 'flowchart', 'mindmap'
  ];
  
  // Count matches for each category
  let uiScore = 0;
  let diagramScore = 0;
  
  // Check for UI keywords
  for (const keyword of uiKeywords) {
    if (lowerPrompt.includes(keyword)) {
      uiScore++;
    }
  }
  
  // Check for diagram keywords
  for (const keyword of diagramKeywords) {
    if (lowerPrompt.includes(keyword)) {
      diagramScore++;
    }
  }
  
  // Return the category with higher score, defaulting to UI if tied or no matches
  return diagramScore > uiScore ? 'ocif' : 'ui';
}

export async function callLLMAPI(
  prompt: string,
  systemMessage: string,
  apiConfig: APIConfig,
  jsonSchema?: Record<string, unknown>
): Promise<string> {
  if (!apiConfig.apiKey) {
    throw new Error(`${apiConfig.name} API key is not set. Please configure it in the settings.`);
  }

  if (apiConfig.name === 'Gemini') {
    try {
      // For Gemini, we'll use a direct API call rather than the structured output
      // Gemini API has a different endpoint structure than other providers
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
      const response = await fetch(`${url}?key=${apiConfig.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${systemMessage}\n\n${prompt}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json() as GeminiResponse;
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('No content returned from Gemini API');
      }

      try {
        // Check if the content is wrapped in markdown code blocks and remove them
        const cleanedContent = removeMarkdownCodeBlocks(content);
        
        const parsedJson = JSON.parse(cleanedContent);
        if (!parsedJson.ocif || parsedJson.ocif !== "https://canvasprotocol.org/ocif/0.4") {
          parsedJson.ocif = "https://canvasprotocol.org/ocif/0.4";
          return JSON.stringify(parsedJson, null, 2);
        }
        return cleanedContent;
      } catch (parseError: unknown) {
        // If we're running evaluation with JSON output format, this is an error
        if (jsonSchema && (jsonSchema.type === 'json_object' || jsonSchema.type === 'object')) {
          throw new Error(`Failed to parse Gemini response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }
        // Otherwise just return the raw content
        return content;
      }
    } catch (error) {
      console.error('Error with Gemini API call:', error);
      throw error;
    }
  } else {
    // Format the response_format appropriately based on the API provider
    let responseFormat = undefined;
    
    if (jsonSchema && apiConfig.name === 'OpenAI') {
      // OpenAI requires specific response_format values
      responseFormat = jsonSchema.type === 'json_object' ? { type: 'json_object' } : undefined;
    } else if (jsonSchema && apiConfig.name !== 'OpenAI') {
      // Other providers might use the schema directly
      responseFormat = jsonSchema;
    }
    
    const response = await fetch(`${apiConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: apiConfig.name === 'OpenAI' ? 'gpt-4.1' : 
               apiConfig.name === 'Anthropic' ? 'claude-3-7-sonnet-20250219' :
               apiConfig.name === 'Mistral' ? 'mistral-large' : 'gpt-4.1',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        ...(responseFormat && { response_format: responseFormat })
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`${apiConfig.name} API error: ${errorData.error?.message || response.statusText}`);
    }

    const data: LLMResponse = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from API');
    }

    try {
      // Check if the content is wrapped in markdown code blocks and remove them
      const cleanedContent = removeMarkdownCodeBlocks(content);
      
      const parsedJson = JSON.parse(cleanedContent);
      if (!parsedJson.ocif || parsedJson.ocif !== "https://canvasprotocol.org/ocif/0.4") {
        parsedJson.ocif = "https://canvasprotocol.org/ocif/0.4";
        return JSON.stringify(parsedJson, null, 2);
      }
      return cleanedContent;
    } catch {
      // Not all responses need to be JSON
      // If we're expecting JSON but got back non-JSON, that's probably an error
      if (jsonSchema && jsonSchema.type === 'json_object') {
        throw new Error('The response is not valid JSON');
      }
      return content;
    }
  }
} 