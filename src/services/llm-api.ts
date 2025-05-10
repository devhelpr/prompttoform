import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z, ZodTypeAny } from "zod";
import { APIConfig } from "../interfaces/api-config";
import { llmAPIs } from "../config/llms";

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

interface GenerateStructuredOutputParams<T extends ZodTypeAny> {
  schema: T;
  request: string;
  temperature?: number;
}

export function getCurrentAPIConfig(): APIConfig {
  const savedSettings = localStorage.getItem("llmSettings");
  if (savedSettings) {
    const { apis, selectedAPI } = JSON.parse(savedSettings);
    const selectedConfig = apis.find(
      (api: APIConfig) => api.name === selectedAPI
    );
    if (selectedConfig) {
      return selectedConfig;
    }
  }

  // Fallback to default OpenAI config
  return llmAPIs[0];
}

export async function generateStructuredOutput<T extends ZodTypeAny>(
  { schema, request, temperature = 1.5 }: GenerateStructuredOutputParams<T>,
  apiKey = ""
): Promise<z.infer<T>> {
  try {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      apiKey: apiKey,
      temperature,
    });
    const schemaObj = schema as unknown as Record<string, unknown>;
    removeAdditionalProperties(schemaObj);
    const structuredLlm = model.withStructuredOutput(schema, {
      strict: false,
    });
    return await structuredLlm.invoke(request);
  } catch (error) {
    console.error("Error in generateStructuredOutput:", error);
    // Re-throw the error with more context
    if (error instanceof Error) {
      throw new Error(`Failed to generate structured output: ${error.message}`);
    }
    throw new Error(`Failed to generate structured output: ${String(error)}`);
  }
}

function removeAdditionalProperties(schema: Record<string, unknown>): void {
  if (schema && typeof schema === "object") {
    delete schema.additionalProperties;
    Object.values(schema).forEach((value) => {
      if (typeof value === "object" && value !== null) {
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
  const strictCodeBlockPattern =
    /^\s*```(?:json|javascript|js)?\s*\n?([\s\S]*?)\n?\s*```\s*$/;
  const strictMatch = content.match(strictCodeBlockPattern);

  if (strictMatch && strictMatch[1]) {
    return strictMatch[1].trim();
  }

  // If not, try to find and extract JSON objects wrapped in {}
  // This is a fallback for partial code blocks or non-standard formatting
  if (content.includes("{") && content.includes("}")) {
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
 * Cleans and formats JSON content from LLM responses
 * @param content The raw content from the LLM
 * @returns Properly formatted JSON string
 */
function cleanAndFormatJson(content: string): string {
  try {
    // First remove any markdown code blocks
    let cleaned = removeMarkdownCodeBlocks(content);

    // Replace literal \n with actual newlines
    cleaned = cleaned.replace(/\\n/g, "\n");

    // Try to parse and re-stringify to ensure valid JSON and proper formatting
    const parsed = JSON.parse(cleaned);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    console.error("Error cleaning JSON:", error);
    // If we can't parse it as JSON, return the original content with just newline replacement
    return content.replace(/\\n/g, "\n");
  }
}

export async function callLLMAPI(
  prompt: string,
  systemMessage: string,
  apiConfig: APIConfig,
  jsonSchema?: any
): Promise<string> {
  if (!apiConfig.apiKey && !apiConfig.systemKey) {
    throw new Error(
      `No API key configured for ${apiConfig.name}. Please go to Settings to configure your API key. Your API keys are stored securely in your browser's localStorage and never transmitted to our servers.`
    );
  }

  if (!apiConfig.isChatCompletionCompatible) {
    try {
      const apiUrl = import.meta.env.PROD
        ? "https://form-generator-worker.maikel-f16.workers.dev"
        : "http://localhost:8787/";
      // For Gemini, we'll use a direct API call rather than the structured output
      // const url =
      //   "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
      const response = await fetch(`${apiUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-url": `${apiConfig.baseUrl}${apiConfig.apiKey}`,
          "api-path": "-",
          "system-key": apiConfig.systemKey ?? "",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemMessage}\n\n${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Gemini API error: ${errorData.error?.message || response.statusText}`
        );
      }

      const data = (await response.json()) as GeminiResponse;
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error("No content returned from Gemini API");
      }

      return cleanAndFormatJson(content);
    } catch (error) {
      console.error("Error with Gemini API call:", error);
      throw error;
    }
  } else {
    // Format the response_format appropriately based on the API provider
    let responseFormat = undefined;

    if (jsonSchema && apiConfig.isChatCompletionCompatible) {
      // OpenAI abd compatible LLM api's requires specific response_format values
      responseFormat = {
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "Form_schema",
            schema: jsonSchema,
          },
        },
      };
    }
    // } else if (jsonSchema) {
    //   // Other providers might use the schema directly
    //   responseFormat = jsonSchema;
    // }

    const apiUrl = import.meta.env.PROD
      ? "https://form-generator-worker.maikel-f16.workers.dev"
      : "http://localhost:8787/";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiConfig.apiKey}`,
        //"anthropic-dangerous-direct-browser-access": "true",
        "api-url": apiConfig.baseUrl,
        "api-path": "/chat/completions",
        "system-key": apiConfig.systemKey ?? "",
      },
      body: JSON.stringify({
        model: apiConfig.model,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        ...(responseFormat && { ...responseFormat }),
      }),
      mode: "cors",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `${apiConfig.name} API error: ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const data: LLMResponse = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from API");
    }

    try {
      const cleanedContent = cleanAndFormatJson(content);
      return cleanedContent;
    } catch {
      // Not all responses need to be JSON
      // If we're expecting JSON but got back non-JSON, that's probably an error
      if (jsonSchema && jsonSchema.type === "json_object") {
        throw new Error("The response is not valid JSON");
      }
      return content;
    }
  }
}
