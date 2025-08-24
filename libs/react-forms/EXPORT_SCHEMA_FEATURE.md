# Export JSON Schema Feature

## Overview

The FormRenderer now includes an export button that generates and downloads a JSON schema based on the form definition. This schema can be used to validate the data structure that is submitted from the form.

## Features

- **Automatic Schema Generation**: Converts form field definitions into a valid JSON Schema (Draft-07)
- **Field Type Mapping**: Maps form field types to appropriate JSON schema types
- **Validation Rules**: Includes validation rules like required fields, min/max length, patterns, etc.
- **Array Support**: Handles array fields with nested item schemas
- **Section Support**: Processes nested fields within section components
- **Download Functionality**: Automatically downloads the schema as a JSON file

## Usage

The export button appears in the form header when the form is not disabled. It's a subtle icon button with a download icon.

### Button Location
- Positioned in the top-right corner of the form header
- Only visible when `disabled={false}` (default)
- Uses a subtle styling that doesn't interfere with the form content

### Generated Schema Features

The generated JSON schema includes:

1. **Field Types**:
   - `text`/`input` → `string` (with format for email, uri, etc.)
   - `textarea` → `string`
   - `checkbox` → `boolean`
   - `radio`/`select` → `string` (with enum for options)
   - `date` → `string` with `format: "date"`
   - `array` → `array` with nested item schema

2. **Validation Rules**:
   - `required` → added to `required` array
   - `minLength`/`maxLength` → string constraints
   - `min`/`max` → number constraints
   - `pattern` → regex pattern for strings
   - `minItems`/`maxItems` → array constraints
   - `minDate`/`maxDate` → date constraints

3. **Field Properties**:
   - `title` → from field label
   - `description` → from helper text
   - `enum`/`enumNames` → for select/radio options

## Example

```typescript
// Form definition
const formDefinition = {
  app: {
    title: 'User Registration',
    pages: [{
      id: 'registration',
      title: 'Registration',
      route: '/registration',
      components: [
        {
          type: 'input',
          id: 'email',
          label: 'Email Address',
          validation: { required: true },
          props: { inputType: 'email' }
        },
        {
          type: 'select',
          id: 'country',
          label: 'Country',
          validation: { required: true },
          options: [
            { label: 'United States', value: 'us' },
            { label: 'Canada', value: 'ca' }
          ]
        }
      ]
    }]
  }
};

// Generated JSON Schema
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "email": {
      "title": "Email Address",
      "type": "string",
      "format": "email"
    },
    "country": {
      "title": "Country",
      "type": "string",
      "enum": ["us", "ca"],
      "enumNames": ["United States", "Canada"]
    }
  },
  "required": ["email", "country"],
  "additionalProperties": false
}
```

## Implementation Details

### Files Added/Modified

1. **`libs/react-forms/src/lib/utils/schema-generator.ts`** - Core schema generation logic
2. **`libs/react-forms/src/lib/atoms/icon-button.tsx`** - Reusable icon button component
3. **`libs/react-forms/src/lib/molecules/FormRenderer.tsx`** - Added export button and functionality
4. **`libs/react-forms/src/examples/export-schema-example.tsx`** - Example demonstrating the feature
5. **`libs/react-forms/src/lib/utils/schema-generator.test.ts`** - Unit tests for schema generation

### Key Functions

- `generateJsonSchema(formDefinition)` - Main function that converts form definition to JSON schema
- `downloadJsonSchema(schema, filename)` - Downloads the schema as a JSON file
- `handleExportSchema()` - FormRenderer callback that generates and downloads the schema

### Schema Generation Process

1. **Parse Form Structure**: Iterate through all pages and components
2. **Process Sections**: Handle nested fields within section components
3. **Map Field Types**: Convert form field types to JSON schema types
4. **Apply Validation**: Include validation rules in the schema
5. **Handle Arrays**: Generate nested schemas for array items
6. **Build Schema**: Construct the final JSON schema object

## Benefits

1. **Data Validation**: Use the generated schema to validate form submissions
2. **API Documentation**: Schema can be used in API documentation
3. **Type Safety**: Generate TypeScript types from the schema
4. **Integration**: Use with validation libraries like Ajv, Joi, etc.
5. **Consistency**: Ensures form data structure matches expectations

## Testing

The feature includes comprehensive unit tests covering:
- Basic field type mapping
- Validation rule inclusion
- Array field handling
- Section component processing
- Edge cases (empty forms, missing fields)

Run tests with:
```bash
npx nx test react-forms
```
