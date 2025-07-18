import { UIJson, JsonFormatOptions } from '../types/form-generator.types';

/**
 * Format JSON for display with proper indentation and newline handling
 */
export function formatJsonForDisplay(
  parsedJson: UIJson,
  options: JsonFormatOptions = {}
): string {
  const {
    indent = 2,
    replaceNewlines = true,
    replaceBackslashes = true,
  } = options;

  let formatted = JSON.stringify(parsedJson, null, indent);

  if (replaceNewlines) {
    formatted = formatted.replace(/\\n/g, '\n');
  }

  if (replaceBackslashes) {
    formatted = formatted.replace(/\\\\/g, '\\');
  }

  return formatted;
}

/**
 * Get raw JSON string for storage (no formatting)
 */
export function getRawJsonForStorage(parsedJson: UIJson): string {
  return JSON.stringify(parsedJson);
}

/**
 * Parse JSON string and return parsed object or null if invalid
 */
export function parseJsonSafely(jsonString: string): UIJson | null {
  try {
    return JSON.parse(jsonString) as UIJson;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return null;
  }
}

/**
 * Validate JSON string format
 */
export function validateJsonFormat(jsonString: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    JSON.parse(jsonString);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON format',
    };
  }
}

/**
 * Format JSON string with consistent indentation
 */
export function formatJsonString(jsonString: string, indent = 2): string {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, indent);
  } catch (error) {
    // If parsing fails, return original string
    return jsonString;
  }
}
