# Empty Value Handling in Template Variables

## Overview

The template variable system now includes comprehensive empty value handling that automatically displays `-` for various types of empty or missing data, while preserving meaningful values like `0` and `false`.

## Empty Value Detection

### The `isEmptyValue` Function

A dedicated helper function determines whether a value should be displayed as `-`:

```typescript
const isEmptyValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (typeof value === 'boolean') return false; // booleans are never "empty"
  if (typeof value === 'number') return false; // numbers are never "empty" (even 0)
  return false;
};
```

## Handling Rules

### ✅ Values That Show as "-"

1. **Undefined**: `undefined` → `-`
2. **Null**: `null` → `-`
3. **Empty String**: `""` → `-`
4. **Whitespace-Only**: `"   "` → `-`
5. **Missing Fields**: `{{nonExistentField}}` → `-`

### ✅ Values That Show Their Actual Value

1. **Numbers**: 
   - `0` → `"0"`
   - `42` → `"42"`
   - `-5` → `"-5"`

2. **Booleans**:
   - `true` → `"Yes"` (in confirmation display) or `"true"` (in templates)
   - `false` → `"No"` (in confirmation display) or `"false"` (in templates)

3. **Non-Empty Strings**:
   - `"Hello"` → `"Hello"`
   - `"0"` → `"0"` (string zero, not numeric)

## Usage Examples

### Form Data Scenarios

```javascript
// Example form values
const formValues = {
  name: "John Smith",          // Shows: "John Smith"
  email: "",                   // Shows: "-"
  phone: "   ",               // Shows: "-" (whitespace only)
  age: 0,                     // Shows: "0" (number zero is valid)
  isSubscribed: false,        // Shows: "false" or "No"
  notes: null,                // Shows: "-"
  score: 42,                  // Shows: "42"
  // missing fields show as "-"
};
```

### Template Variable Results

```html
<!-- Template -->
Name: {{name}}
Email: {{email}}
Phone: {{phone}}
Age: {{age}}
Subscribed: {{isSubscribed}}
Notes: {{notes}}
Score: {{score}}
Missing: {{missingField}}

<!-- Rendered Output -->
Name: John Smith
Email: -
Phone: -
Age: 0
Subscribed: false
Notes: -
Score: 42
Missing: -
```

## Implementation Details

### Template Variable Replacement

Both `FormRenderer` and `FormConfirmationField` use the same `isEmptyValue` logic:

```typescript
// In template replacement
if (!isEmptyValue(directValue)) {
  return String(directValue);
}
// ... try variations ...
// Return dash if nothing found or all values are empty
return '-';
```

### Confirmation Display

The `getDisplayValue` function in `FormConfirmationField` also uses this logic:

```typescript
const getDisplayValue = (component, value): string => {
  if (isEmptyValue(value)) {
    return '-';
  }
  // ... format according to component type ...
}
```

## Special Cases

### Checkbox Components

- **Single Checkbox**: `false` → "No", `true` → "Yes"
- **Multi-Checkbox**: Empty array `[]` → "None selected"
- **Unchecked**: `undefined`/`null` → "-"

### Radio/Select Components

- **No Selection**: `undefined`/`null`/`""` → "-"
- **Valid Selection**: Shows the option label

### Date Components

- **Empty Date**: `undefined`/`null`/`""` → "-"
- **Invalid Date**: `"invalid"` → "-" (after date parsing fails)
- **Valid Date**: `"2023-12-25"` → "12/25/2023" (formatted)

## Benefits

### 1. Consistent User Experience
- All empty states show the same professional `-` indicator
- No confusing empty spaces or broken template variables

### 2. Meaningful Data Preservation
- Important values like `0` and `false` are never hidden
- Users can distinguish between "not answered" and "answered with zero/false"

### 3. Professional Appearance
- Clean, consistent styling across all forms
- No technical artifacts visible to end users

### 4. Robust Error Handling
- Gracefully handles any type of empty or invalid data
- Never breaks the UI or shows error messages

## Testing

Use the `EmptyValuesTestExample` component to verify behavior:

```typescript
import { EmptyValuesTestExample } from '@react-forms/examples';
```

This test form includes:
- Required and optional fields
- Different field types (text, number, boolean, textarea)
- Template variables referencing non-existent fields
- Examples of how different empty states render

## Migration Notes

- **Existing Behavior**: Previous versions showed `"Not provided"` in confirmation displays
- **New Behavior**: All empty states consistently show `-`
- **Backward Compatibility**: All existing forms continue to work
- **Improvement**: More professional and consistent appearance

This comprehensive empty value handling ensures that template variables always provide a clean, professional user experience regardless of data completeness!
