# Template Variables in Form Confirmation

The form confirmation component now supports template variables that can be automatically replaced with actual form values. This is particularly useful for AI-generated form summaries.

## Template Variable Syntax

Template variables use double curly braces: `{{variableName}}`

Example:
```
Name: {{fullName}}
Email: {{email}}
Health Status: Smoking: {{smoker}} • Pre-existing: {{preExisting}}
```

## How It Works

When the confirmation component encounters template variables in the `customMessage`, it automatically:

1. **Direct Field Matching**: Looks for exact field ID matches
2. **Nested Path Support**: Handles paths like `{{applicant.fullName}}`
3. **Case Variations**: Tries lowercase and other common variations
4. **Partial Matching**: Finds fields that contain the variable name
5. **Fallback Display**: Shows `[variableName]` if no match is found

## Field Name Matching Strategies

The component tries multiple strategies to match template variables to form fields:

### 1. Exact Match
```
{{fullName}} → matches field with id="fullName"
{{email}} → matches field with id="email"
```

### 2. Nested Object Paths
```
{{applicant.fullName}} → looks for nested object structure
{{health.smoker}} → looks for health.smoker path
```

### 3. Case Variations
```
{{fullName}} → also tries "fullname", "full_name"
{{firstName}} → also tries "firstname", "first_name"
```

### 4. Partial Matching
```
{{smoker}} → matches "isSmoker", "smokingStatus", etc.
{{medication}} → matches "takingMedication", "medications", etc.
```

## Usage Example

```typescript
{
  type: 'confirmation',
  id: 'summary',
  props: {
    confirmationSettings: {
      showSummary: false, // Disable regular summary
      customTitle: 'Application Summary',
      customMessage: `Name
{{fullName}}

Email
{{email}}

Health Overview
Smoking: {{smoker}} • Pre-existing: {{preExisting}} • Medications: {{takingMedication}}

Please review and confirm your information.`
    }
  }
}
```

## Real Form Data Replacement

Given a form with these values:
```javascript
{
  fullName: "John Smith",
  email: "john@example.com", 
  smoker: "no",
  preExisting: true,
  takingMedication: false
}
```

The template would render as:
```
Name
John Smith

Email
john@example.com

Health Overview
Smoking: no • Pre-existing: true • Medications: false
```

## Advanced Features

### Boolean Value Handling
- Boolean values are displayed as "true"/"false"
- For better UX, consider using radio buttons with "Yes"/"No" options

### Missing Field Handling
- Missing fields show as `-` instead of breaking
- This provides a clean, professional appearance for missing data

### Whitespace Preservation
- Uses `whitespace-pre-line` CSS to preserve line breaks and spacing
- Allows for formatted multi-line summaries

## Best Practices

1. **Use Descriptive Field IDs**: Make field IDs match expected template variables
2. **Test Template Variables**: Verify that all variables resolve correctly
3. **Provide Fallbacks**: Consider what happens if fields are missing
4. **Format Boolean Values**: Use radio buttons instead of checkboxes for better display

## Integration with AI Generation

This feature is designed to work seamlessly with AI-generated forms where the AI might create template-based summaries like:

```
Application Summary
Name: {{applicant.fullName}}
Email: {{applicant.email}}
Phone: {{applicant.phone}}

Insurance Details
Coverage Type: {{insurance.coverageType}}
Premium: ${{insurance.monthlyPremium}}
```

The confirmation component will automatically resolve these variables based on the actual form field values, providing a smooth experience even when AI generates template-based content.
