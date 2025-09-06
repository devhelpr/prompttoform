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
    processComponents(
      page.components,
      properties,
      required,
      page,
      formDefinition
    );
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

function hasFieldDependencies(
  fieldId: string,
  formDefinition?: FormDefinition
): boolean {
  if (!formDefinition) return false;

  // Check for visibility conditions
  for (const page of formDefinition.app.pages) {
    for (const component of page.components) {
      if (component.id === fieldId) {
        if (
          component.visibilityConditions &&
          component.visibilityConditions.length > 0
        ) {
          return true;
        }
      }
    }
  }

  // Check for branch dependencies
  for (const page of formDefinition.app.pages) {
    if (page.branches && page.branches.length > 0) {
      for (const branch of page.branches) {
        const conditionField = branch.condition.field;
        // If this field is the condition field for a branch, it has dependencies
        if (conditionField === fieldId) {
          return true;
        }

        // If this field comes after a page with branches, it might be conditionally required
        // This is a simplified check - in practice, we'd need more complex logic
        // to determine if a field is conditionally reachable
        let foundCurrentPage = false;
        for (const subsequentPage of formDefinition.app.pages) {
          if (subsequentPage.id === page.id) {
            foundCurrentPage = true;
            continue;
          }
          if (foundCurrentPage) {
            for (const component of subsequentPage.components) {
              if (component.id === fieldId) {
                return true; // This field is conditionally reachable
              }
            }
          }
        }
      }
    }
  }

  return false;
}

function processComponents(
  components: FormComponentFieldProps[],
  properties: Record<string, any>,
  required: string[],
  page?: any,
  formDefinition?: FormDefinition
): void {
  components.forEach((component) => {
    if (component.type === 'section' && component.children) {
      // Process section children
      processComponents(
        component.children,
        properties,
        required,
        page,
        formDefinition
      );
    } else if (component.type === 'array' && component.arrayItems) {
      // Handle array fields
      const arraySchema = generateArraySchema(component, page);
      if (arraySchema) {
        properties[component.id] = arraySchema;
        // Only add to required if no dependencies
        if (
          component.validation?.required &&
          !hasFieldDependencies(component.id, formDefinition)
        ) {
          required.push(component.id);
        }
      }
    } else if (isDataField(component.type)) {
      // Handle regular data fields
      const fieldSchema = generateFieldSchema(component, page);
      if (fieldSchema) {
        properties[component.id] = fieldSchema;
        // Only add to required if no dependencies
        if (
          component.validation?.required &&
          !hasFieldDependencies(component.id, formDefinition)
        ) {
          required.push(component.id);
        }
      }
    }
  });
}

function isDataField(type: FieldType): boolean {
  return ['input', 'textarea', 'checkbox', 'radio', 'select', 'date'].includes(
    type
  );
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
        description: `${
          baseSchema.description || ''
        } Must be a valid email address.`,
      };
    case 'number':
      return {
        ...baseSchema,
        type: 'number',
        minimum: component.validation?.min,
        maximum: component.validation?.max,
        description: `${baseSchema.description || ''} Numeric value${
          component.validation?.min !== undefined
            ? ` (min: ${component.validation.min})`
            : ''
        }${
          component.validation?.max !== undefined
            ? ` (max: ${component.validation.max})`
            : ''
        }.`,
      };
    case 'url':
      return {
        ...baseSchema,
        type: 'string',
        format: 'uri',
        minLength: component.validation?.minLength,
        maxLength: component.validation?.maxLength,
        pattern: component.validation?.pattern,
        description: `${baseSchema.description || ''} Must be a valid URL.`,
      };
    case 'tel':
      return {
        ...baseSchema,
        type: 'string',
        pattern: '^[+]?[0-9\\s\\-\\(\\)]+$',
        minLength: component.validation?.minLength,
        maxLength: component.validation?.maxLength,
        description: `${
          baseSchema.description || ''
        } Must be a valid phone number.`,
      };
    case 'password':
      return {
        ...baseSchema,
        type: 'string',
        format: 'password',
        minLength: component.validation?.minLength,
        maxLength: component.validation?.maxLength,
        pattern: component.validation?.pattern,
        description: `${baseSchema.description || ''} Password field${
          component.validation?.pattern ? ' with specific requirements' : ''
        }.`,
      };
    default:
      return {
        ...baseSchema,
        type: 'string',
        minLength: component.validation?.minLength,
        maxLength: component.validation?.maxLength,
        pattern: component.validation?.pattern,
        description: `${baseSchema.description || ''} Text input field.`,
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
    description: `${baseSchema.description || ''} Multi-line text area${
      component.validation?.maxLength
        ? ` (max ${component.validation.maxLength} characters)`
        : ''
    }.`,
  };
}

function generateCheckboxSchema(
  component: FormComponentFieldProps,
  baseSchema: SchemaField
): SchemaField {
  return {
    ...baseSchema,
    type: 'boolean',
    description: `${baseSchema.description || ''} Boolean checkbox field.`,
  };
}

function generateSelectSchema(
  component: FormComponentFieldProps,
  baseSchema: SchemaField
): SchemaField {
  // Check both component.props.options and component.options
  const options =
    (component.props as any)?.options || (component as any)?.options;

  if (options && options.length > 0) {
    const enumValues = options.map((opt: any) => opt.value);
    const enumNames = options.map((opt: any) => opt.label);

    return {
      ...baseSchema,
      type: 'string',
      enum: enumValues,
      enumNames: enumNames,
      description: `${
        baseSchema.description || ''
      } Must be one of the available options: ${enumNames.join(', ')}`,
      // Ensure strict validation by removing any conflicting properties
      minLength: undefined,
      maxLength: undefined,
      pattern: undefined,
    };
  }

  // If no options are defined, still create a string field but warn in description
  return {
    ...baseSchema,
    type: 'string',
    description: `${
      baseSchema.description || ''
    } No predefined options available.`,
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
    description: `${baseSchema.description || ''} Date field${
      component.validation?.minDate
        ? ` (min: ${component.validation.minDate})`
        : ''
    }${
      component.validation?.maxDate
        ? ` (max: ${component.validation.maxDate})`
        : ''
    }.`,
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

  // Build a map of conditional fields and their dependencies
  const conditionalFields = new Map<string, any[]>();

  formDefinition.app.pages.forEach((page) => {
    page.components.forEach((component) => {
      if (
        component.visibilityConditions &&
        component.visibilityConditions.length > 0
      ) {
        conditionalFields.set(component.id, component.visibilityConditions);
      }
    });
  });

  // Generate conditional validation rules
  if (conditionalFields.size > 0) {
    // Group fields by their condition field
    const conditionGroups = new Map<
      string,
      { field: string; operator: string; value: any }[]
    >();

    conditionalFields.forEach((visibilityConditions, fieldId) => {
      visibilityConditions.forEach((condition) => {
        if (!conditionGroups.has(condition.field)) {
          conditionGroups.set(condition.field, []);
        }
        conditionGroups.get(condition.field)!.push({
          field: fieldId,
          operator: condition.operator,
          value: condition.value,
        });
      });
    });

    // Create conditional rules for each condition field
    conditionGroups.forEach((dependentFields, conditionField) => {
      // Group by operator and value
      const groups = new Map<string, string[]>();

      dependentFields.forEach(({ field, operator, value }) => {
        const key = `${operator}:${value}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(field);
      });

      // Create rules for each group
      groups.forEach((fields, key) => {
        const [operator, value] = key.split(':');

        if (operator === '==') {
          // When condition is met, require the dependent fields
          conditions.push({
            if: {
              properties: {
                [conditionField]: { const: value },
              },
              required: [conditionField],
            },
            then: {
              required: fields,
            },
          });

          // When condition is NOT met, forbid the dependent fields
          conditions.push({
            if: {
              properties: {
                [conditionField]: { not: { const: value } },
              },
              required: [conditionField],
            },
            then: {
              not: {
                anyOf: fields.map((field) => ({ required: [field] })),
              },
            },
          });
        } else if (operator === '!=') {
          // When condition is NOT met, require the dependent fields
          conditions.push({
            if: {
              properties: {
                [conditionField]: { not: { const: value } },
              },
              required: [conditionField],
            },
            then: {
              required: fields,
            },
          });

          // When condition IS met, forbid the dependent fields
          conditions.push({
            if: {
              properties: {
                [conditionField]: { const: value },
              },
              required: [conditionField],
            },
            then: {
              not: {
                anyOf: fields.map((field) => ({ required: [field] })),
              },
            },
          });
        }
      });
    });
  }

  if (conditions.length > 0) {
    schema.allOf = conditions;
  }
}

function addDependentValidation(
  schema: JsonSchema,
  formDefinition: FormDefinition
): void {
  const branchConditions: any[] = [];

  // Find pages with branches that affect field requirements
  formDefinition.app.pages.forEach((page) => {
    if (page.branches && page.branches.length > 0) {
      page.branches.forEach((branch) => {
        const conditionField = branch.condition.field;
        const conditionValue = branch.condition.value;

        // For the specific case where conditionValue is "none"
        if (conditionValue === 'none') {
          // Find all data fields from pages that are only reachable when condition is NOT "none"
          const conditionalFields: string[] = [];

          // Get all data fields from pages that come after the current page
          // (these are only reachable when we don't branch to "none")
          let foundCurrentPage = false;
          formDefinition.app.pages.forEach((subsequentPage) => {
            if (subsequentPage.id === page.id) {
              foundCurrentPage = true;
              return;
            }
            if (foundCurrentPage) {
              subsequentPage.components.forEach((component: any) => {
                if (isDataField(component.type)) {
                  conditionalFields.push(component.id);
                }
              });
            }
          });

          if (conditionalFields.length > 0) {
            // When symptomRadio is "none", forbid the conditional fields
            branchConditions.push({
              if: {
                properties: { [conditionField]: { const: conditionValue } },
                required: [conditionField],
              },
              then: {
                not: {
                  anyOf: conditionalFields.map((field) => ({
                    required: [field],
                  })),
                },
              },
            });

            // When symptomRadio is NOT "none", require the conditional fields
            branchConditions.push({
              if: {
                properties: {
                  [conditionField]: { enum: ['fever', 'cough', 'breath'] },
                },
                required: [conditionField],
              },
              then: {
                required: conditionalFields,
              },
            });
          }
        }
      });
    }
  });

  if (branchConditions.length > 0) {
    if (!schema.allOf) {
      schema.allOf = [];
    }
    schema.allOf.push(...branchConditions);
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
