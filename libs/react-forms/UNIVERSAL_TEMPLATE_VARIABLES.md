# Universal Template Variables Support

The form renderer now supports template variables throughout the entire form system - not just in confirmation components, but in all form components that display text content.

## Overview

Template variables use double curly braces `{{variableName}}` and are automatically replaced with actual form values when the form is rendered. This feature works across:

- **Text components**: In `helperText`, `content`, and `text` properties
- **All form fields**: In `helperText` properties (input, textarea, select, radio, checkbox, date)
- **Confirmation components**: In `customMessage` properties
- **Any component props**: That contain string values with template syntax

## Template Variable Syntax

```
{{fieldName}}           - Direct field reference
{{applicant.fullName}}  - Nested object path
{{health.smoker}}       - Dot notation for nested data
```

## How It Works

### 1. Automatic Detection
The system automatically detects template variables using regex pattern `/\{\{[^}]+\}\}/g`

### 2. Smart Field Matching
When a template variable is found, the system tries multiple strategies to find the corresponding form value:

1. **Exact Match**: Direct field ID lookup
2. **Nested Path**: For dot notation like `applicant.fullName`
3. **Case Variations**: Tries lowercase, snake_case conversions
4. **Partial Matching**: Finds fields containing the variable name
5. **Fallback Display**: Shows `-` if no match found

### 3. Real-time Updates
Template variables are resolved every time the component renders, so they automatically update as users fill out the form.

## Use Cases

### 1. AI-Generated Forms
Perfect for AI systems that generate form summaries with template placeholders:

```json
{
  "type": "text",
  "label": "Application Summary", 
  "props": {
    "helperText": "Name: {{fullName}}\nEmail: {{email}}\nSmoking: {{smoker}}"
  }
}
```

### 2. Dynamic Help Text
Show contextual information based on user input:

```json
{
  "type": "input",
  "label": "Confirm Email",
  "props": {
    "helperText": "Please re-enter: {{email}}"
  }
}
```

### 3. Review/Summary Pages
Create dynamic summary sections using text components:

```json
{
  "type": "section",
  "label": "Review Information",
  "children": [
    {
      "type": "text",
      "label": "Personal Details",
      "props": {
        "helperText": "{{fullName}} ({{email}})"
      }
    },
    {
      "type": "text", 
      "label": "Health Status",
      "props": {
        "helperText": "Smoker: {{smoker}} • Medications: {{takingMedication}}"
      }
    }
  ]
}
```

## Example Implementation

### Health Insurance Form
```json
{
  "id": "review",
  "title": "Review & Submit",
  "components": [
    {
      "id": "summarySection",
      "type": "section",
      "label": "Application Summary",
      "children": [
        {
          "id": "summaryName",
          "type": "text",
          "label": "Name",
          "props": {
            "helperText": "{{fullName}}"
          }
        },
        {
          "id": "summaryEmail", 
          "type": "text",
          "label": "Email",
          "props": {
            "helperText": "{{email}}"
          }
        },
        {
          "id": "summaryHealth",
          "type": "text",
          "label": "Health Overview", 
          "props": {
            "helperText": "Smoking: {{smoker}} • Pre-existing: {{preExisting}} • Medications: {{takingMedication}}"
          }
        }
      ]
    }
  ]
}
```

### Runtime Replacement
When user fills out the form with:
```javascript
{
  fullName: "John Smith",
  email: "john@example.com",
  smoker: "no", 
  preExisting: "yes",
  takingMedication: true
}
```

The template resolves to:
```
Name: John Smith
Email: john@example.com  
Health Overview: Smoking: no • Pre-existing: yes • Medications: true
```

## Advanced Features

### 1. Nested Object Support
Handles complex data structures:
```json
{
  "helperText": "{{applicant.address.city}}, {{applicant.address.state}}"
}
```

### 2. Field Name Variations
Automatically tries common naming patterns:
- `{{fullName}}` matches `fullname`, `full_name`, `FullName`
- `{{emailAddress}}` matches `email`, `email_address`, `emailAddr`

### 3. Partial Matching
Finds related fields when exact matches fail:
- `{{medication}}` matches `takingMedication`, `currentMedications`
- `{{phone}}` matches `phoneNumber`, `mobilePhone`

### 4. Error Resilience
Gracefully handles missing fields:
- Shows `-` instead of breaking the UI
- Continues processing other template variables
- Provides clean, professional appearance for missing data

## Integration Points

### FormRenderer Updates
All component rendering now processes props through `processPropsWithTemplates()`:

```typescript
// Text components
<TextFormField label={label} props={processPropsWithTemplates(props)} />

// Form fields  
<FormInputField 
  props={processPropsWithTemplates(props)}
  // ... other props
/>

// Confirmation components
<FormConfirmationField 
  props={processPropsWithTemplates(props)}
  // ... other props  
/>
```

### Template Processing Function
Core replacement logic handles all variable resolution:

```typescript
const replaceTemplateVariables = (text: string, values: FormValues): string => {
  // Regex finds all {{variable}} patterns
  // Multiple matching strategies applied
  // Fallback handling for missing fields
  // Returns processed text with resolved variables
}
```

## Best Practices

### 1. Descriptive Field Names
Use clear, descriptive field IDs that match expected template variables:
```json
{ "id": "fullName" }     // Good: matches {{fullName}}
{ "id": "fn" }           // Poor: unclear abbreviation
```

### 2. Consistent Naming
Maintain consistent field naming patterns across your forms:
```json
{ "id": "applicantName" }
{ "id": "applicantEmail" }  
{ "id": "applicantPhone" }
```

### 3. Test Template Resolution
Verify that all template variables resolve correctly:
- Fill out test forms completely
- Check review/summary pages for `[fieldName]` placeholders
- Ensure complex templates render properly

### 4. Graceful Degradation  
Design templates that work even if some fields are missing:
```json
{
  "helperText": "Contact: {{email}}{{phone ? ' • ' + phone : ''}}"
}
```

## Compatibility

- ✅ **Backward Compatible**: Existing forms work without changes
- ✅ **Performance Optimized**: Only processes props containing template syntax
- ✅ **Type Safe**: Full TypeScript support throughout
- ✅ **Error Resilient**: Graceful handling of missing/malformed templates

This universal template variable support makes forms more dynamic and intelligent, perfect for AI-generated content and user-friendly review experiences!
