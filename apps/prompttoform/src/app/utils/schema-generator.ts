import { FormDefinition, FormComponentFieldProps } from '@devhelpr/react-forms';
import { FieldType } from '@devhelpr/react-forms';

interface JsonSchema {
  $schema: string;
  $id?: string;
  title?: string;
  description?: string;
  type: 'object';
  properties: Record<string, any>;
  required: string[];
  additionalProperties: boolean;
  allOf?: any[];
  anyOf?: any[];
  oneOf?: any[];
  not?: any;
  if?: any;
  then?: any;
  else?: any;
  dependentRequired?: Record<string, string[]>;
  dependentSchemas?: Record<string, any>;
  patternProperties?: Record<string, any>;
  propertyNames?: any;
  unevaluatedProperties?: boolean | any;
  unevaluatedItems?: boolean | any;
}

interface SchemaField {
  type?: string;
  title?: string;
  description?: string;
  required?: boolean;
  [key: string]: any;
}

interface FormMetadata {
  formTitle: string;
  totalPages: number;
  hasBranches: boolean;
  hasConditions: boolean;
  hasArrays: boolean;
  hasSections: boolean;
  fieldCount: number;
  requiredFieldCount: number;
}

export function generateJsonSchema(formDefinition: FormDefinition): JsonSchema {
  const properties: Record<string, any> = {};
  const required: string[] = [];
  const metadata = analyzeFormDefinition(formDefinition);

  // Process all pages and their components
  formDefinition.app.pages.forEach((page) => {
    processComponents(page.components, properties, required, page);
  });

  const schema: JsonSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `https://form-schema.example.com/${formDefinition.app.title
      .toLowerCase()
      .replace(/\s+/g, '-')}`,
    title: `${formDefinition.app.title} - Form Data Schema`,
    description: generateSchemaDescription(metadata),
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  };

  // Add conditional validation if there are visibility conditions
  if (metadata.hasConditions) {
    addConditionalValidation(schema, formDefinition);
  }

  // Add dependent validation if there are branches
  if (metadata.hasBranches) {
    addDependentValidation(schema, formDefinition);
  }

  return schema;
}

function analyzeFormDefinition(formDefinition: FormDefinition): FormMetadata {
  let fieldCount = 0;
  let requiredFieldCount = 0;
  let hasBranches = false;
  let hasConditions = false;
  let hasArrays = false;
  let hasSections = false;

  formDefinition.app.pages.forEach((page) => {
    if (page.branches && page.branches.length > 0) {
      hasBranches = true;
    }

    analyzeComponents(page.components);
  });

  function analyzeComponents(components: FormComponentFieldProps[]) {
    components.forEach((component) => {
      if (component.type === 'section' && component.children) {
        hasSections = true;
        analyzeComponents(component.children);
      } else if (component.type === 'array' && component.arrayItems) {
        hasArrays = true;
        fieldCount++;
        if (component.validation?.required) {
          requiredFieldCount++;
        }
        component.arrayItems.forEach((item) => {
          if (item.components) {
            analyzeComponents(item.components);
          }
        });
      } else if (isDataField(component.type)) {
        fieldCount++;
        if (component.validation?.required) {
          requiredFieldCount++;
        }
        if (
          component.visibilityConditions &&
          component.visibilityConditions.length > 0
        ) {
          hasConditions = true;
        }
      }
    });
  }

  return {
    formTitle: formDefinition.app.title,
    totalPages: formDefinition.app.pages.length,
    hasBranches,
    hasConditions,
    hasArrays,
    hasSections,
    fieldCount,
    requiredFieldCount,
  };
}

function generateSchemaDescription(metadata: FormMetadata): string {
  let description = `Schema for form data submitted from "${metadata.formTitle}". `;
  description += `This form has ${metadata.totalPages} page${
    metadata.totalPages > 1 ? 's' : ''
  } `;
  description += `with ${metadata.fieldCount} field${
    metadata.fieldCount > 1 ? 's' : ''
  } `;
  description += `(${metadata.requiredFieldCount} required).`;

  if (metadata.hasBranches) {
    description += ' The form includes conditional branching logic.';
  }
  if (metadata.hasConditions) {
    description += ' Some fields have visibility conditions.';
  }
  if (metadata.hasArrays) {
    description += ' The form includes array/repeatable sections.';
  }
  if (metadata.hasSections) {
    description += ' The form is organized into sections.';
  }

  return description;
}

function processComponents(
  components: FormComponentFieldProps[],
  properties: Record<string, any>,
  required: string[],
  page?: any
): void {
  components.forEach((component) => {
    if (component.type === 'section' && component.children) {
      // Process section children
      processComponents(component.children, properties, required, page);
    } else if (component.type === 'array' && component.arrayItems) {
      // Handle array fields
      const arraySchema = generateArraySchema(component, page);
      if (arraySchema) {
        properties[component.id] = arraySchema;
        if (component.validation?.required) {
          required.push(component.id);
        }
      }
    } else if (isDataField(component.type)) {
      // Handle regular data fields
      const fieldSchema = generateFieldSchema(component, page);
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
  component: FormComponentFieldProps,
  page?: any
): SchemaField | null {
  const baseSchema: SchemaField = {
    title: component.label || component.id,
    description: generateFieldDescription(component, page),
  };

  // Add metadata about the field
  if (
    component.visibilityConditions &&
    component.visibilityConditions.length > 0
  ) {
    baseSchema.metadata = {
      visibilityConditions: component.visibilityConditions,
      pageId: page?.id,
      pageTitle: page?.title,
    };
  }

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

function generateFieldDescription(
  component: FormComponentFieldProps,
  page?: any
): string {
  let description = component.props?.helperText || '';

  if (page) {
    if (description) description += ' ';
    description += `Field from page: ${page.title}`;
  }

  if (
    component.visibilityConditions &&
    component.visibilityConditions.length > 0
  ) {
    if (description) description += ' ';
    description += 'This field has visibility conditions.';
  }

  return description;
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
        minLength: component.validation?.minLength,
        maxLength: component.validation?.maxLength,
        pattern: component.validation?.pattern,
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
        minLength: component.validation?.minLength,
        maxLength: component.validation?.maxLength,
        pattern: component.validation?.pattern,
      };
    case 'tel':
      return {
        ...baseSchema,
        type: 'string',
        pattern: '^[+]?[0-9\\s\\-\\(\\)]+$',
        minLength: component.validation?.minLength,
        maxLength: component.validation?.maxLength,
      };
    case 'password':
      return {
        ...baseSchema,
        type: 'string',
        format: 'password',
        minLength: component.validation?.minLength,
        maxLength: component.validation?.maxLength,
        pattern: component.validation?.pattern,
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
  component: FormComponentFieldProps,
  page?: any
): SchemaField | null {
  if (!component.arrayItems || component.arrayItems.length === 0) {
    return {
      type: 'array',
      title: component.label || component.id,
      description: generateFieldDescription(component, page),
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
          const fieldSchema = generateFieldSchema(subComponent, page);
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
    description: generateFieldDescription(component, page),
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

function addConditionalValidation(
  schema: JsonSchema,
  formDefinition: FormDefinition
): void {
  const conditions: any[] = [];

  formDefinition.app.pages.forEach((page) => {
    page.components.forEach((component) => {
      if (
        component.visibilityConditions &&
        component.visibilityConditions.length > 0
      ) {
        component.visibilityConditions.forEach((condition) => {
          conditions.push({
            if: {
              properties: {
                [condition.field]: {
                  [getConditionOperator(condition.operator)]: condition.value,
                },
              },
            },
            then: {
              properties: {
                [component.id]: {
                  type: 'string', // or appropriate type
                },
              },
            },
          });
        });
      }
    });
  });

  if (conditions.length > 0) {
    schema.allOf = conditions;
  }
}

function addDependentValidation(
  schema: JsonSchema,
  formDefinition: FormDefinition
): void {
  const dependentRequired: Record<string, string[]> = {};
  const dependentSchemas: Record<string, any> = {};

  formDefinition.app.pages.forEach((page) => {
    if (page.branches && page.branches.length > 0) {
      page.branches.forEach((branch) => {
        const conditionField = branch.condition.field;
        const operator = branch.condition.operator;
        const value = branch.condition.value;

        // Add dependent validation based on branch conditions
        if (!dependentRequired[conditionField]) {
          dependentRequired[conditionField] = [];
        }

        // Add dependent schema for conditional fields
        dependentSchemas[conditionField] = {
          if: {
            properties: {
              [conditionField]: {
                [getConditionOperator(operator)]: value,
              },
            },
          },
          then: {
            // Add validation for fields that depend on this condition
            properties: {
              // This would need to be expanded based on actual dependent fields
            },
          },
        };
      });
    }
  });

  if (Object.keys(dependentRequired).length > 0) {
    schema.dependentRequired = dependentRequired;
  }

  if (Object.keys(dependentSchemas).length > 0) {
    schema.dependentSchemas = dependentSchemas;
  }
}

function getConditionOperator(operator: string): string {
  switch (operator) {
    case '==':
      return 'const';
    case '!=':
      return 'not';
    case '>':
      return 'exclusiveMinimum';
    case '<':
      return 'exclusiveMaximum';
    case '>=':
      return 'minimum';
    case '<=':
      return 'maximum';
    default:
      return 'const';
  }
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
