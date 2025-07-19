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
 * Enhanced to handle edge cases and provide better error information
 */
export function parseJsonSafely(jsonString: string): UIJson | null {
  if (!jsonString || typeof jsonString !== 'string') {
    console.error('parseJsonSafely: Invalid input - not a string or empty');
    return null;
  }

  try {
    // First attempt: direct parsing
    return JSON.parse(jsonString) as UIJson;
  } catch (error) {
    console.error('parseJsonSafely: First parsing attempt failed:', error);

    try {
      // Second attempt: clean control characters (except tabs, newlines, carriage returns)
      const cleaned = jsonString.replace(
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g,
        ''
      );
      const parsed = JSON.parse(cleaned) as UIJson;
      console.log(
        'parseJsonSafely: Successfully parsed after cleaning control characters'
      );
      return parsed;
    } catch (secondError) {
      console.error(
        'parseJsonSafely: Second parsing attempt also failed:',
        secondError
      );

      try {
        // Third attempt: try to fix common issues
        let fixed = jsonString;

        // Fix unescaped quotes in strings
        fixed = fixed.replace(/(?<!\\)"/g, (match, offset) => {
          // Check if this quote is inside a string (odd number of quotes before it)
          const before = fixed.substring(0, offset);
          const quoteCount = (before.match(/"/g) || []).length;
          return quoteCount % 2 === 0 ? match : '\\"';
        });

        const parsed = JSON.parse(fixed) as UIJson;
        console.log(
          'parseJsonSafely: Successfully parsed after fixing common issues'
        );
        return parsed;
      } catch (thirdError) {
        console.error(
          'parseJsonSafely: All parsing attempts failed. Original error:',
          error
        );
        console.error('JSON preview:', jsonString.substring(0, 200));
        return null;
      }
    }
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
