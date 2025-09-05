import { describe, it, expect } from 'vitest';
import { generateJsonSchema } from './schema-generator';

describe('Minimal Schema Generator Test', () => {
  it('should generate basic schema', () => {
    const simpleForm = {
      app: {
        title: 'Simple Test',
        pages: [
          {
            id: 'main',
            title: 'Main Page',
            route: '/main',
            components: [
              {
                type: 'text' as const,
                id: 'firstName',
                label: 'First Name',
                validation: { required: true },
                props: { inputType: 'text' },
              },
            ],
          },
        ],
      },
    };

    const schema = generateJsonSchema(simpleForm);

    expect(schema).toBeDefined();
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.title).toBe('Simple Test - Form Data Schema');
    expect(schema.type).toBe('object');
    expect(schema.required).toContain('firstName');
  });
});
