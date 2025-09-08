import { describe, it, expect } from 'vitest';
import { getSystemPrompt } from '../system-prompt';
import { UISchema } from '../../types/ui-schema';

describe('System Prompt', () => {
  const mockUISchema: UISchema = {
    type: 'object',
    properties: {
      app: { type: 'object' },
      pages: { type: 'array' },
    },
  } as UISchema;

  it('should include multi-language guidelines', () => {
    const systemPrompt = getSystemPrompt(mockUISchema);

    // Check for critical multi-language guidelines
    expect(systemPrompt).toContain('CRITICAL MULTI-LANGUAGE GUIDELINES:');
    expect(systemPrompt).toContain(
      'NEVER add language selector dropdowns or language switching components to forms'
    );
    expect(systemPrompt).toContain(
      'NEVER include language lists in form titles'
    );
    expect(systemPrompt).toContain(
      'Keep form titles clean and focused on purpose'
    );
    expect(systemPrompt).toContain(
      'The system handles language selection automatically'
    );
  });

  it('should include detailed multi-language examples', () => {
    const systemPrompt = getSystemPrompt(mockUISchema);

    // Check for detailed examples section
    expect(systemPrompt).toContain('For multi-language forms:');
    expect(systemPrompt).toContain(
      'IMPORTANT: Do NOT add language selector dropdowns'
    );
    expect(systemPrompt).toContain(
      'Do NOT include language lists in form titles'
    );
    expect(systemPrompt).toContain(
      'Language selection is handled by the system UI'
    );
  });

  it('should include incorrect vs correct examples', () => {
    const systemPrompt = getSystemPrompt(mockUISchema);

    // Check for specific examples
    expect(systemPrompt).toContain('INCORRECT - Language selector in form:');
    expect(systemPrompt).toContain('INCORRECT - Language list in title:');
    expect(systemPrompt).toContain(
      'CORRECT - Clean title without language info:'
    );
    expect(systemPrompt).toContain(
      '"title": "Contact Form (English, Spanish, French)"'
    );
    expect(systemPrompt).toContain('"title": "Contact Form"');
  });

  it('should include the UI schema in the prompt', () => {
    const systemPrompt = getSystemPrompt(mockUISchema);
    const schemaString = JSON.stringify(mockUISchema, null, 2);

    expect(systemPrompt).toContain(schemaString);
  });

  it('should include all important rules sections', () => {
    const systemPrompt = getSystemPrompt(mockUISchema);

    // Check for key sections
    expect(systemPrompt).toContain('Important rules for UI/Form schema:');
    expect(systemPrompt).toContain('1. The output must be valid JSON');
    expect(systemPrompt).toContain('2. Include all required fields');
    expect(systemPrompt).toContain(
      '3. Generate practical and usable UI components'
    );
  });
});
