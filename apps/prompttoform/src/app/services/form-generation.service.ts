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
      // Convert newlines back to escaped form for the update API
      const jsonForUpdate = currentJson.replace(/\n/g, '\\n');
      const patch = await updateFormWithPatch(jsonForUpdate, updatePrompt);

      // Parse the patch operations
      let patchOperations = JSON.parse(patch);
      if (!Array.isArray(patchOperations)) {
        patchOperations = [patchOperations];
      }

      // Parse the current form
      const currentForm = parseJsonSafely(currentJson);
      if (!currentForm) {
        return {
          success: false,
          error: 'Failed to parse current form JSON',
        };
      }

      // Apply the patch operations
      const updatedForm = this.applyPatchOperations(
        currentForm,
        patchOperations
      );

      // Format the updated form
      const formattedJson = formatJsonForDisplay(updatedForm);
      const rawJson = getRawJsonForStorage(updatedForm);

      // Store update in IndexedDB if we have a session
      if (sessionId) {
        try {
          await FormSessionService.storeUpdate(
            sessionId,
            updatePrompt,
            rawJson
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
            current.splice(index, 0, value);
          }
        } else if (op === 'remove') {
          if (Array.isArray(current)) {
            current.splice(index, 1);
          }
        } else if (op === 'replace') {
          if (Array.isArray(current)) {
            current[index] = value;
          }
        }
      } else {
        if (op === 'add' || op === 'replace') {
          if (typeof current === 'object' && current !== null) {
            current[lastPart] = value;
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
}
