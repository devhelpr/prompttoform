import { FormDefinition, FormComponentFieldProps } from '@devhelpr/react-forms';
import { FieldType } from '@devhelpr/react-forms';

interface JsonSchema {
  $schema: string;
  type: 'object';
  properties: Record<string, any>;
  required: string[];
  additionalProperties: boolean;
}

interface SchemaField {
  type?: string;
  title?: string;
  description?: string;
  required?: boolean;
  [key: string]: any;
}

export function generateJsonSchema(formDefinition: FormDefinition): JsonSchema {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  // Process all pages and their components
  formDefinition.app.pages.forEach((page) => {
    processComponents(page.components, properties, required);
  });

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  };
}

function processComponents(
  components: FormComponentFieldProps[],
  properties: Record<string, any>,
  required: string[]
): void {
  components.forEach((component) => {
    if (component.type === 'section' && component.children) {
      // Process section children
      processComponents(component.children, properties, required);
    } else if (component.type === 'array' && component.arrayItems) {
      // Handle array fields
      const arraySchema = generateArraySchema(component);
      if (arraySchema) {
        properties[component.id] = arraySchema;
        if (component.validation?.required) {
          required.push(component.id);
        }
      }
    } else if (isDataField(component.type)) {
      // Handle regular data fields
      const fieldSchema = generateFieldSchema(component);
      if (fieldSchema) {
        properties[component.id] = fieldSchema;
        if (component.validation?.required) {
          required.push(component.id);
        }
      }
    }
  });
}

function isDataField(type: FieldType): boolean {
  return [
    'text',
    'input',
    'textarea',
    'checkbox',
    'radio',
    'select',
    'date',
  ].includes(type);
}

function generateFieldSchema(
  component: FormComponentFieldProps
): SchemaField | null {
  const baseSchema: SchemaField = {
    title: component.label || component.id,
    description: component.props?.helperText,
  };

  switch (component.type) {
    case 'text':
    case 'input':
      return generateInputSchema(component, baseSchema);
    case 'textarea':
      return generateTextareaSchema(component, baseSchema);
    case 'checkbox':
      return generateCheckboxSchema(component, baseSchema);
    case 'radio':
    case 'select':
      return generateSelectSchema(component, baseSchema);
    case 'date':
      return generateDateSchema(component, baseSchema);
    default:
      return null;
  }
}

function generateInputSchema(
  component: FormComponentFieldProps,
  baseSchema: SchemaField
): SchemaField {
  const inputType = component.props?.inputType || 'text';

  switch (inputType) {
    case 'email':
      return {
        ...baseSchema,
        type: 'string',
        format: 'email',
      };
    case 'number':
      return {
        ...baseSchema,
        type: 'number',
        minimum: component.validation?.min,
        maximum: component.validation?.max,
      };
    case 'url':
      return {
        ...baseSchema,
        type: 'string',
        format: 'uri',
      };
    case 'tel':
      return {
        ...baseSchema,
        type: 'string',
        pattern: '^[+]?[0-9\\s\\-\\(\\)]+$',
      };
    default:
      return {
        ...baseSchema,
        type: 'string',
        minLength: component.validation?.minLength,
        maxLength: component.validation?.maxLength,
        pattern: component.validation?.pattern,
      };
  }
}

function generateTextareaSchema(
  component: FormComponentFieldProps,
  baseSchema: SchemaField
): SchemaField {
  return {
    ...baseSchema,
    type: 'string',
    minLength: component.validation?.minLength,
    maxLength: component.validation?.maxLength,
  };
}

function generateCheckboxSchema(
  component: FormComponentFieldProps,
  baseSchema: SchemaField
): SchemaField {
  return {
    ...baseSchema,
    type: 'boolean',
  };
}

function generateSelectSchema(
  component: FormComponentFieldProps,
  baseSchema: SchemaField
): SchemaField {
  if (component.options && component.options.length > 0) {
    return {
      ...baseSchema,
      type: 'string',
      enum: component.options.map((opt) => opt.value),
      enumNames: component.options.map((opt) => opt.label),
    };
  }

  return {
    ...baseSchema,
    type: 'string',
  };
}

function generateDateSchema(
  component: FormComponentFieldProps,
  baseSchema: SchemaField
): SchemaField {
  return {
    ...baseSchema,
    type: 'string',
    format: 'date',
    minimum: component.validation?.minDate,
    maximum: component.validation?.maxDate,
  };
}

function generateArraySchema(
  component: FormComponentFieldProps
): SchemaField | null {
  if (!component.arrayItems || component.arrayItems.length === 0) {
    return {
      type: 'array',
      items: { type: 'object' },
    };
  }

  const itemProperties: Record<string, any> = {};
  const itemRequired: string[] = [];

  component.arrayItems.forEach((item) => {
    // Process components within each array item
    if (item.components) {
      item.components.forEach((subComponent) => {
        if (isDataField(subComponent.type)) {
          const fieldSchema = generateFieldSchema(subComponent);
          if (fieldSchema) {
            itemProperties[subComponent.id] = fieldSchema;
            if (subComponent.validation?.required) {
              itemRequired.push(subComponent.id);
            }
          }
        }
      });
    }
  });

  return {
    type: 'array',
    title: component.label || component.id,
    description: component.props?.helperText,
    items: {
      type: 'object',
      properties: itemProperties,
      required: itemRequired,
      additionalProperties: false,
    },
    minItems: component.validation?.minItems,
    maxItems: component.validation?.maxItems,
  };
}

export function downloadJsonSchema(
  schema: JsonSchema,
  filename = 'form-schema.json'
): void {
  const schemaString = JSON.stringify(schema, null, 2);
  const blob = new Blob([schemaString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
