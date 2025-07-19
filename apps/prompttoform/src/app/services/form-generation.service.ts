import { UISchema } from '../types/ui-schema';
import { UIJson } from '../types/form-generator.types';
import { generateUIFromPrompt, updateFormWithPatch } from './llm';
import { getCurrentAPIConfig } from './llm-api';
import {
  parseJsonSafely,
  formatJsonForDisplay,
  getRawJsonForStorage,
} from '../utils/json-utils';
import { FormSessionService } from './indexeddb';

export interface FormGenerationResult {
  success: boolean;
  parsedJson?: UIJson;
  formattedJson?: string;
  rawJson?: string;
  error?: string;
  sessionId?: string;
}

export interface FormUpdateResult {
  success: boolean;
  updatedJson?: string;
  error?: string;
}

export class FormGenerationService {
  private uiSchema: UISchema;
  private skipValidation: boolean;

  constructor(uiSchema: UISchema, skipValidation = true) {
    this.uiSchema = uiSchema;
    this.skipValidation = skipValidation;
  }

  /**
   * Generate a form from a prompt
   */
  async generateForm(prompt: string): Promise<FormGenerationResult> {
    if (!prompt.trim()) {
      return {
        success: false,
        error: 'Please enter a prompt',
      };
    }

    try {
      // Check if API key is set
      const apiConfig = getCurrentAPIConfig();
      if (!apiConfig.apiKey && !apiConfig.systemKey) {
        return {
          success: false,
          error: `No API key set for ${apiConfig.name}. Please configure it in the Settings.`,
        };
      }

      // Call the UI generation API
      const response = await generateUIFromPrompt(prompt, this.uiSchema);

      // Try to parse the response as JSON
      const parsedResponse = parseJsonSafely(response);
      if (!parsedResponse) {
        return {
          success: false,
          error: 'Failed to parse the generated JSON. Please try again.',
        };
      }

      // Validate the response if validation is enabled
      if (!this.skipValidation) {
        const validationResult = this.validateFormSchema(parsedResponse);
        if (!validationResult.isValid) {
          return {
            success: false,
            error: `Validation failed: ${validationResult.error}`,
          };
        }
      }

      // Format JSON for display and storage
      const formattedJson = formatJsonForDisplay(parsedResponse);
      const rawJson = getRawJsonForStorage(parsedResponse);

      // Store session in IndexedDB
      let sessionId: string | undefined;
      try {
        sessionId = await FormSessionService.createSession(prompt, rawJson);
        console.log('Session stored with ID:', sessionId);
      } catch (error) {
        console.error('Failed to store session in IndexedDB:', error);
        // Don't fail the generation if storage fails
      }

      return {
        success: true,
        parsedJson: parsedResponse,
        formattedJson,
        rawJson,
        sessionId,
      };
    } catch (error) {
      console.error('Error generating form:', error);
      return {
        success: false,
        error: 'An error occurred while generating the UI/Form.',
      };
    }
  }

  /**
   * Update an existing form with a patch
   */
  async updateForm(
    currentJson: string,
    updatePrompt: string,
    sessionId?: string
  ): Promise<FormUpdateResult> {
    if (!updatePrompt.trim() || !currentJson) {
      return {
        success: false,
        error:
          'Please enter an update prompt and make sure a form is generated',
      };
    }

    try {
      console.log('updateForm - currentJson length:', currentJson?.length);
      console.log(
        'updateForm - currentJson preview:',
        currentJson?.substring(0, 100)
      );

      // First, try to parse the current JSON to ensure it's valid
      const parsedCurrentForm = parseJsonSafely(currentJson);
      if (!parsedCurrentForm) {
        console.error('updateForm - Failed to parse current JSON');
        return {
          success: false,
          error: 'Failed to parse current form JSON',
        };
      }

      console.log('updateForm - Successfully parsed current JSON');

      // Get the raw JSON (without formatting) for the update API
      const rawJsonForUpdate = getRawJsonForStorage(parsedCurrentForm);
      const patch = await updateFormWithPatch(rawJsonForUpdate, updatePrompt);

      // Parse the patch operations
      let patchOperations = JSON.parse(patch);
      if (!Array.isArray(patchOperations)) {
        patchOperations = [patchOperations];
      }

      // Apply the patch operations
      console.log('Applying patch operations:', patchOperations);
      const updatedForm = this.applyPatchOperations(
        parsedCurrentForm,
        patchOperations
      );

      console.log('Updated form structure:', {
        hasApp: !!updatedForm.app,
        hasPages: !!updatedForm.app?.pages,
        pagesLength: updatedForm.app?.pages?.length,
      });

      // Format the updated form
      const formattedJson = formatJsonForDisplay(updatedForm);
      console.log('Formatted JSON length:', formattedJson.length);

      // Test if the formatted JSON is valid
      try {
        JSON.parse(formattedJson);
        console.log('✅ Formatted JSON is valid');
      } catch (parseError) {
        console.error('❌ Formatted JSON is invalid:', parseError);
        console.log('Formatted JSON preview:', formattedJson.substring(0, 200));
      }

      const rawJsonForStorage = getRawJsonForStorage(updatedForm);
      console.log('Raw JSON for storage length:', rawJsonForStorage.length);

      // Test if the raw JSON is valid
      try {
        JSON.parse(rawJsonForStorage);
        console.log('✅ Raw JSON for storage is valid');
      } catch (parseError) {
        console.error('❌ Raw JSON for storage is invalid:', parseError);
        console.log('Raw JSON preview:', rawJsonForStorage.substring(0, 200));
      }

      // Store update in IndexedDB if we have a session
      if (sessionId) {
        try {
          await FormSessionService.storeUpdate(
            sessionId,
            updatePrompt,
            rawJsonForStorage
          );
          console.log('Update stored for session:', sessionId);
        } catch (error) {
          console.error('Failed to store update in IndexedDB:', error);
        }
      }

      return {
        success: true,
        updatedJson: formattedJson,
      };
    } catch (error) {
      console.error('Error updating form:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update form',
      };
    }
  }

  /**
   * Validate form against schema
   */
  private validateFormSchema(form: UIJson): {
    isValid: boolean;
    error?: string;
  } {
    try {
      // This would use Ajv validation in a real implementation
      // For now, just check if the form has the required structure
      if (!form.app || !form.app.pages || !Array.isArray(form.app.pages)) {
        return {
          isValid: false,
          error: 'Form must have app.pages array',
        };
      }
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation error',
      };
    }
  }

  /**
   * Apply patch operations to a form
   */
  private applyPatchOperations(form: UIJson, operations: any[]): UIJson {
    const updatedForm = { ...form } as UIJson;

    for (const operation of operations) {
      const { op, path, value } = operation;
      console.log(`Applying operation: ${op} at path: ${path}`);

      // Sanitize the value to prevent JSON issues
      const sanitizedValue = this.sanitizeValue(value);

      const pathParts = path.split('/').filter(Boolean);
      let current: any = updatedForm;

      // Navigate to the parent of the target
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (part.match(/^\d+$/)) {
          if (Array.isArray(current)) {
            current = current[parseInt(part)];
          }
        } else {
          if (typeof current === 'object' && current !== null) {
            current = current[part];
          }
        }
      }

      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart.match(/^\d+$/)) {
        const index = parseInt(lastPart);
        if (op === 'add') {
          if (Array.isArray(current)) {
            current.splice(index, 0, sanitizedValue);
          }
        } else if (op === 'remove') {
          if (Array.isArray(current)) {
            current.splice(index, 1);
          }
        } else if (op === 'replace') {
          if (Array.isArray(current)) {
            current[index] = sanitizedValue;
          }
        }
      } else {
        if (op === 'add' || op === 'replace') {
          if (typeof current === 'object' && current !== null) {
            current[lastPart] = sanitizedValue;
          }
        } else if (op === 'remove') {
          if (typeof current === 'object' && current !== null) {
            delete current[lastPart];
          }
        }
      }
    }

    return updatedForm;
  }

  /**
   * Sanitize a value to prevent JSON parsing issues
   */
  private sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      // Only remove control characters, don't escape quotes or backslashes
      // as they might already be properly escaped
      return value.replace(
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g,
        ''
      );
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize object properties
      const sanitized: any = Array.isArray(value) ? [] : {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  }
}
