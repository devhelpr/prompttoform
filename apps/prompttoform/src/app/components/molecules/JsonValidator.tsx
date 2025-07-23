import { useState, useEffect, useMemo } from 'react';
import { UIJson } from '../../types/form-generator.types';

interface JsonValidatorProps {
  jsonString: string;
  onValidJson: (parsedJson: UIJson) => void;
  onInvalidJson: (errors: string[]) => void;
  className?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  parsedJson?: UIJson;
}

export function JsonValidator({
  jsonString,
  onValidJson,
  onInvalidJson,
  className = '',
}: JsonValidatorProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
  });

  const [showErrors, setShowErrors] = useState(false);

  // Validate JSON in real-time
  const validateJson = useMemo(() => {
    if (!jsonString.trim()) {
      return { isValid: true, errors: [] };
    }

    try {
      const parsed = JSON.parse(jsonString) as UIJson;

      // Basic structure validation
      const errors: string[] = [];

      if (!parsed.app) {
        errors.push('Missing "app" property');
      } else {
        if (!parsed.app.title) {
          errors.push('Missing "app.title" property');
        }
        if (!parsed.app.pages || !Array.isArray(parsed.app.pages)) {
          errors.push('Missing or invalid "app.pages" array');
        } else if (parsed.app.pages.length === 0) {
          errors.push('"app.pages" array cannot be empty');
        } else {
          // Validate each page
          parsed.app.pages.forEach((page, index) => {
            if (!page.id) {
              errors.push(`Page ${index + 1}: Missing "id" property`);
            }
            if (!page.title) {
              errors.push(`Page ${index + 1}: Missing "title" property`);
            }
            if (!page.route) {
              errors.push(`Page ${index + 1}: Missing "route" property`);
            }
            if (!page.components || !Array.isArray(page.components)) {
              errors.push(
                `Page ${index + 1}: Missing or invalid "components" array`
              );
            } else {
              // Validate each component
              page.components.forEach((component, componentIndex) => {
                if (!component.id) {
                  errors.push(
                    `Page ${index + 1}, Component ${
                      componentIndex + 1
                    }: Missing "id" property`
                  );
                }
                if (!component.type) {
                  errors.push(
                    `Page ${index + 1}, Component ${
                      componentIndex + 1
                    }: Missing "type" property`
                  );
                }
                if (component.label === undefined || component.label === null) {
                  errors.push(
                    `Page ${index + 1}, Component ${
                      componentIndex + 1
                    }: Missing "label" property`
                  );
                }
              });
            }
          });
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        parsedJson: errors.length === 0 ? parsed : undefined,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [
          `JSON Syntax Error: ${
            error instanceof Error ? error.message : 'Invalid JSON'
          }`,
        ],
      };
    }
  }, [jsonString]);

  // Update validation result and notify parent
  useEffect(() => {
    setValidationResult(validateJson);

    if (validateJson.isValid && validateJson.parsedJson) {
      onValidJson(validateJson.parsedJson);
    } else {
      onInvalidJson(validateJson.errors);
    }
  }, [validateJson]);

  const getLineNumber = (error: string): number | null => {
    // Try to extract line number from JSON parse errors
    const match = error.match(/position (\d+)/);
    if (match) {
      const position = parseInt(match[1]);
      return jsonString.substring(0, position).split('\n').length;
    }
    return null;
  };

  const formatError = (error: string): string => {
    const lineNumber = getLineNumber(error);
    return lineNumber ? `Line ${lineNumber}: ${error}` : error;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Validation Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {validationResult.isValid ? (
            <>
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-green-800">
                Valid JSON
              </span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="text-sm font-medium text-red-800">
                {validationResult.errors.length} Error
                {validationResult.errors.length !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>

        {!validationResult.isValid && validationResult.errors.length > 0 && (
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="text-sm text-zinc-600 hover:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
          >
            {showErrors ? 'Hide' : 'Show'} Details
          </button>
        )}
      </div>

      {/* Error Details */}
      {!validationResult.isValid &&
        showErrors &&
        validationResult.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 mb-3">
              Validation Errors:
            </h4>
            <ul className="space-y-2">
              {validationResult.errors.map((error, index) => (
                <li
                  key={index}
                  className="text-sm text-red-700 flex items-start space-x-2"
                >
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{formatError(error)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Quick Fixes */}
      {!validationResult.isValid && validationResult.errors.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Quick Fixes:
          </h4>
          <ul className="space-y-1 text-sm text-blue-700">
            {validationResult.errors.some((error) =>
              error.includes('Missing "app"')
            ) && <li>• Add a root "app" object with title and pages</li>}
            {validationResult.errors.some((error) =>
              error.includes('Missing "app.pages"')
            ) && <li>• Add a "pages" array to the app object</li>}
            {validationResult.errors.some((error) =>
              error.includes('Missing "id"')
            ) && (
              <li>
                • Ensure all pages and components have unique "id" properties
              </li>
            )}
            {validationResult.errors.some((error) =>
              error.includes('Missing "type"')
            ) && (
              <li>
                • Add "type" property to all components (text, email, select,
                etc.)
              </li>
            )}
            {validationResult.errors.some((error) =>
              error.includes('Missing "route"')
            ) && (
              <li>
                • Add "route" property to all pages (e.g., "/", "/step1",
                "/step2")
              </li>
            )}
            {validationResult.errors.some((error) =>
              error.includes('JSON Syntax Error')
            ) && <li>• Check for missing commas, brackets, or quotes</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
