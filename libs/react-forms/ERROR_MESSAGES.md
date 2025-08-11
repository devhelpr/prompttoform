# WCAG-Compatible Error Messages

## Overview

The form system now supports configurable, WCAG-compatible error messages that provide better accessibility and user experience. Error messages can be customized per field and validation rule, with intelligent fallbacks to default accessible messages.

## Features

### 1. **Configurable Error Messages**
- Custom error messages for each validation rule
- Placeholder replacement for dynamic values
- Fallback to default WCAG-compatible messages

### 2. **WCAG Compliance**
- Clear, descriptive error messages
- Actionable guidance for users
- Consistent language and tone
- Screen reader friendly

### 3. **Comprehensive Coverage**
- All validation types supported
- Input type-specific validation (email, number, date)
- Array/checkbox validation
- Pattern validation

## Schema Updates

### New `errorMessages` Object

The validation object now supports an `errorMessages` property:

```json
{
  "validation": {
    "required": true,
    "minLength": 3,
    "maxLength": 50,
    "errorMessages": {
      "required": "Please enter your name",
      "minLength": "Name must be at least {minLength} characters long",
      "maxLength": "Name cannot exceed {maxLength} characters"
    }
  }
}
```

### Supported Error Message Types

| Error Type | Description | Placeholders |
|------------|-------------|--------------|
| `required` | Required field validation | None |
| `minLength` | Minimum length validation | `{minLength}` |
| `maxLength` | Maximum length validation | `{maxLength}` |
| `pattern` | Pattern/regex validation | None |
| `minItems` | Minimum array items | `{minItems}` |
| `maxItems` | Maximum array items | `{maxItems}` |
| `minDate` | Minimum date validation | `{minDate}` |
| `maxDate` | Maximum date validation | `{maxDate}` |
| `min` | Minimum numeric value | `{min}` |
| `max` | Maximum numeric value | `{max}` |
| `invalidFormat` | Invalid format (pattern) | None |
| `invalidEmail` | Invalid email format | None |
| `invalidNumber` | Invalid number format | None |
| `invalidDate` | Invalid date format | None |

## Implementation Details

### Error Message Helper Function

```typescript
const getErrorMessage = (
  component: FormComponentFieldProps,
  errorType: string,
  params: Record<string, string | number> = {}
): string => {
  const customMessage = component.validation?.errorMessages?.[errorType];
  
  if (customMessage) {
    // Replace placeholders in custom message
    return customMessage.replace(/\{(\w+)\}/g, (match, key) => {
      return String(params[key] || match);
    });
  }

  // Default WCAG-compatible error messages
  const defaultMessages: Record<string, string> = {
    required: 'This field is required',
    minLength: `Please enter at least ${params.minLength} characters`,
    maxLength: `Please enter no more than ${params.maxLength} characters`,
    // ... more default messages
  };

  return defaultMessages[errorType] || 'Please enter a valid value';
};
```

### Enhanced Validation Logic

The validation system now includes:

1. **Input Type Validation**:
   - Email format validation with custom messages
   - Number format and range validation
   - Date format validation

2. **Improved Error Detection**:
   - Uses `isEmptyValue` function for consistent empty detection
   - Better handling of edge cases

3. **Placeholder Replacement**:
   - Dynamic value insertion in error messages
   - Fallback handling for missing placeholders

4. **Field Context Integration**:
   - Automatic field label inclusion in error messages
   - Context-specific error descriptions

### ARIA Implementation

All form components now include proper ARIA attributes for full WCAG compliance:

#### Input Fields (text, email, number, date)
```html
<input 
  aria-required="true"
  aria-invalid="true"
  aria-describedby="field-error"
  required
/>
<div id="field-error" role="alert" aria-live="polite">
  Error message
</div>
```

#### Textarea Fields
```html
<textarea 
  aria-required="true"
  aria-invalid="true"
  aria-describedby="field-error"
  required
/>
```

#### Select Fields
```html
<select 
  aria-required="true"
  aria-invalid="true"
  aria-describedby="field-error"
  required
/>
```

#### Radio Button Groups
```html
<div role="radiogroup" aria-describedby="field-error" aria-invalid="true">
  <input type="radio" aria-required="true" />
  <input type="radio" aria-required="true" />
</div>
```

#### Checkbox Groups
```html
<div role="group" aria-describedby="field-error" aria-invalid="true">
  <input type="checkbox" />
  <input type="checkbox" />
</div>
```

#### Required Indicators
```html
<span aria-hidden="true">*</span>
```

## Usage Examples

### Basic Required Field

```json
{
  "id": "name",
  "type": "input",
  "label": "Full Name",
  "validation": {
    "required": true,
    "errorMessages": {
      "required": "Please enter your full name to continue"
    }
  }
}
```

### Length Validation with Placeholders

```json
{
  "id": "bio",
  "type": "textarea",
  "label": "Bio",
  "validation": {
    "required": true,
    "minLength": 10,
    "maxLength": 500,
    "errorMessages": {
      "required": "Please tell us about yourself",
      "minLength": "Your bio must be at least {minLength} characters long",
      "maxLength": "Your bio cannot exceed {maxLength} characters"
    }
  }
}
```

### Email Validation

```json
{
  "id": "email",
  "type": "input",
  "label": "Email Address",
  "props": {
    "inputType": "email"
  },
  "validation": {
    "required": true,
    "errorMessages": {
      "required": "Please provide your email address",
      "invalidEmail": "Please enter a valid email address (e.g., user@domain.com)"
    }
  }
}
```

### Number Range Validation

```json
{
  "id": "age",
  "type": "input",
  "label": "Age",
  "props": {
    "inputType": "number"
  },
  "validation": {
    "required": true,
    "min": 18,
    "max": 120,
    "errorMessages": {
      "required": "Please enter your age",
      "invalidNumber": "Please enter a valid number",
      "min": "You must be at least {min} years old to use this form",
      "max": "Please enter a realistic age (maximum {max} years)"
    }
  }
}
```

### Date Range Validation

```json
{
  "id": "birthDate",
  "type": "date",
  "label": "Date of Birth",
  "validation": {
    "required": true,
    "minDate": "1900-01-01",
    "maxDate": "2020-12-31",
    "errorMessages": {
      "required": "Please select your date of birth",
      "invalidDate": "Please enter a valid date in YYYY-MM-DD format",
      "minDate": "Date of birth must be on or after {minDate}",
      "maxDate": "Date of birth must be before {maxDate}"
    }
  }
}
```

### Array/Checkbox Validation

```json
{
  "id": "interests",
  "type": "checkbox",
  "label": "Interests (Select 2-4 options)",
  "props": {
    "options": [
      { "label": "Technology", "value": "tech" },
      { "label": "Sports", "value": "sports" }
    ]
  },
  "validation": {
    "required": true,
    "minItems": 2,
    "maxItems": 4,
    "errorMessages": {
      "required": "Please select at least some interests",
      "minItems": "Please select at least {minItems} interests",
      "maxItems": "Please select no more than {maxItems} interests"
    }
  }
}
```

## WCAG Guidelines Compliance

### 1. **Clear and Descriptive**
- Error messages clearly explain what went wrong
- Provide specific guidance on how to fix the issue
- Use plain language accessible to all users
- **Field-specific context**: Messages include the field name (e.g., "Email address is required")

### 2. **Actionable**
- Messages tell users exactly what they need to do
- Include examples where helpful (e.g., email format)
- Provide context for validation rules

### 3. **Consistent**
- Uniform language and tone across all error messages
- Consistent structure and formatting
- Predictable behavior for users

### 4. **Programmatically Determinable**
- **ARIA attributes**: `aria-required`, `aria-invalid`, `aria-describedby`
- **Live regions**: Error messages use `role="alert"` and `aria-live="polite"`
- **Field association**: Errors are programmatically linked to their fields
- **Screen reader announcements**: Dynamic error messages are announced appropriately

### 5. **Proper HTML Structure**
- **Required indicators**: Asterisks marked with `aria-hidden="true"`
- **Error containers**: Unique IDs for error message containers
- **Helper text**: Properly associated with form fields
- **Group semantics**: Radio and checkbox groups use appropriate ARIA roles

## Default Error Messages

If no custom error messages are provided, the system uses these WCAG-compatible defaults:

| Validation Type | Default Message |
|----------------|-----------------|
| Required | "{fieldLabel} is required" |
| Min Length | "{fieldLabel} must be at least {minLength} characters long" |
| Max Length | "{fieldLabel} cannot exceed {maxLength} characters" |
| Pattern | "{fieldLabel} format is invalid" |
| Min Items | "Please select at least {minItems} items for {fieldLabel}" |
| Max Items | "Please select no more than {maxItems} items for {fieldLabel}" |
| Min Date | "{fieldLabel} must be on or after {minDate}" |
| Max Date | "{fieldLabel} must be before {maxDate}" |
| Min Value | "{fieldLabel} must be at least {min}" |
| Max Value | "{fieldLabel} cannot exceed {max}" |
| Invalid Email | "Please enter a valid email address for {fieldLabel}" |
| Invalid Number | "Please enter a valid number for {fieldLabel}" |
| Invalid Date | "Please enter a valid date for {fieldLabel}" |

## Best Practices

### 1. **Be Specific**
```json
// Good
"required": "Please enter your full name to continue"

// Avoid
"required": "Required"
```

### 2. **Use Placeholders**
```json
// Good
"minLength": "Your name must be at least {minLength} characters long"

// Avoid
"minLength": "Name too short"
```

### 3. **Provide Examples**
```json
// Good
"invalidEmail": "Please enter a valid email address (e.g., user@domain.com)"

// Avoid
"invalidEmail": "Invalid email"
```

### 4. **Be Helpful**
```json
// Good
"max": "You must be at least {min} years old to use this form"

// Avoid
"max": "Value too high"
```

## Testing

Use the `ErrorMessagesExample` component to test all error message features:

```typescript
import { ErrorMessagesExample } from '@react-forms/examples';
```

This example demonstrates:
- All validation types with custom messages
- Placeholder replacement functionality
- WCAG-compatible language
- Different input types and their validation

## Migration Notes

- **Backward Compatible**: Existing forms continue to work without changes
- **Progressive Enhancement**: Add custom error messages as needed
- **Default Fallbacks**: Always provides accessible default messages
- **No Breaking Changes**: All existing validation rules work unchanged

This comprehensive error message system ensures forms are accessible, user-friendly, and compliant with WCAG guidelines!
