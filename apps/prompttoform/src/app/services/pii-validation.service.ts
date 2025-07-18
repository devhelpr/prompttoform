import { detectPIIWithBSN } from '../utils/pii-detect';
import { PIIValidationResult } from '../types/form-generator.types';

export class PIIValidationService {
  /**
   * Validate text for PII (Personally Identifiable Information)
   */
  validatePII(text: string): PIIValidationResult {
    const piiEntities = detectPIIWithBSN(text);

    if (piiEntities.length > 0) {
      const warningMessage = `Warning: Privacy sensitive data detected: ${piiEntities
        .map((entity) => `${entity.type} (${entity.match})`)
        .join(', ')}`;

      return {
        hasPII: true,
        warningMessage,
      };
    }

    return {
      hasPII: false,
    };
  }

  /**
   * Validate multiple text fields for PII
   */
  validateMultipleFields(
    fields: Record<string, string>
  ): Record<string, PIIValidationResult> {
    const results: Record<string, PIIValidationResult> = {};

    for (const [fieldName, text] of Object.entries(fields)) {
      results[fieldName] = this.validatePII(text);
    }

    return results;
  }

  /**
   * Check if any field has PII
   */
  hasAnyPII(fields: Record<string, string>): boolean {
    return Object.values(fields).some((text) => this.validatePII(text).hasPII);
  }

  /**
   * Get all PII entities from multiple fields
   */
  getAllPIIEntities(
    fields: Record<string, string>
  ): Array<{ field: string; entity: any }> {
    const entities: Array<{ field: string; entity: any }> = [];

    for (const [fieldName, text] of Object.entries(fields)) {
      const piiEntities = detectPIIWithBSN(text);
      piiEntities.forEach((entity) => {
        entities.push({ field: fieldName, entity });
      });
    }

    return entities;
  }
}
