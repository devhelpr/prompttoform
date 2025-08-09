# System Prompt Updates for Template Variables

## Overview

The system prompt has been updated to guide AI form generation towards using template variables and avoiding unnecessary bindings. This ensures generated forms work seamlessly with the new template variable system.

## Key Changes Made

### 1. **Removed Bindings Guidance**
**Before:**
```
8. For data binding:
   - Connect components to data sources when appropriate
   - Specify which field the component is bound to
   - Include onChange handlers for data updates
```

**After:**
```
8. For data binding:
   - IMPORTANT: Do NOT generate bindings objects for form components
   - Form components automatically bind to their field ID - no explicit binding needed
   - Only use data sources for actual API endpoints, not for form field binding
```

### 2. **Added Template Variables Section**
New comprehensive section (14) covering:
- Template variable syntax: `{{fieldId}}` (simple field IDs only)
- **IMPORTANT**: Use direct field IDs like `{{fullName}}`, NOT nested paths like `{{applicant.fullName}}`
- Where template variables work (text components, helperText, etc.)
- Automatic resolution to form values or "-" for missing fields
- Use cases for dynamic summaries and contextual help
- Examples of proper template variable usage

### 3. **Enhanced Component Type Guidance**
Updated section 6 to include:
- Better descriptions of when to use each component type
- Added `date` component type
- Added `confirmation` component (with guidance to prefer text components)
- Clarified that buttons are rarely needed (auto-generated)

### 4. **Added Confirmation/Review Page Guidance**
New section (15) showing:
- How to create review pages using text components with template variables
- Section structure for grouping summary information
- Concrete examples of summary layouts

### 5. **Added Examples of Correct vs Incorrect Patterns**
New section (16) with side-by-side comparisons:

**INCORRECT - Using bindings:**
```json
{
  "id": "fullName",
  "type": "input",
  "bindings": {
    "dataSource": "userAPI",
    "field": "user.fullName"
  }
}
```

**CORRECT - Simple field ID:**
```json
{
  "id": "fullName", 
  "type": "input",
  "label": "Full Name",
  "validation": { "required": true }
}
```

**INCORRECT - Complex confirmation component:**
```json
{
  "type": "confirmation",
  "props": {
    "confirmationSettings": {
      "showSummary": true,
      "groupBySection": true
    }
  }
}
```

**CORRECT - Text components with template variables (direct field IDs):**
```json
{
  "type": "text",
  "label": "Summary",
  "props": {
    "helperText": "Name\n{{fullName}}\n\nEmail\n{{email}}\n\nPhone\n{{phone}}"
  }
}
```

**INCORRECT - Nested template variables:**
```json
{
  "type": "text",
  "label": "Summary", 
  "props": {
    "helperText": "Name: {{applicant.fullName}} • Email: {{user.email}}"
  }
}
```

## Expected Impact

### AI-Generated Forms Will Now:
1. **Use Simple Field IDs**: No more complex binding objects
2. **Generate Direct Template Variables**: Use `{{fullName}}` instead of `{{applicant.fullName}}`
3. **Create Descriptive Field IDs**: Like "fullName", "email", "heightCm", "preExistingConditions" 
4. **Generate Template Variables**: Automatic summaries using `{{fieldId}}` syntax
5. **Create Clean Review Pages**: Using text components instead of complex confirmation setups
6. **Show Professional Missing Data**: "-" appears for missing fields instead of errors

### Benefits:
- **Simpler JSON**: Less complex structure, easier to understand
- **Better Performance**: No unnecessary binding overhead
- **Consistent Behavior**: Template variables work universally
- **Professional Appearance**: Clean handling of missing data
- **AI-Friendly**: Perfect for AI-generated dynamic content

## Template Variable Examples in Generated Forms

### Health Insurance Application:
```json
{
  "type": "section",
  "label": "Application Summary",
  "children": [
    {
      "type": "text",
      "label": "Personal Information",
      "props": {
        "helperText": "Name\n{{fullName}}\n\nEmail\n{{email}}\n\nPhone\n{{phone}}\n\nDate of birth\n{{dob}}"
      }
    },
    {
      "type": "text",
      "label": "Health Summary",
      "props": {
        "helperText": "Height: {{heightCm}} cm • Weight: {{weightKg}} kg • Smoker: {{smoker}}"
      }
    },
    {
      "type": "text",
      "label": "Pre-existing conditions",
      "props": {
        "helperText": "{{preExistingConditions}}"
      }
    }
  ]
}
```

### Contact Form Summary:
```json
{
  "type": "text",
  "label": "Message Summary",
  "props": {
    "helperText": "Name\n{{name}}\n\nEmail\n{{email}}\n\nSubject\n{{subject}}\n\nMessage\n{{message}}"
  }
}
```

## Migration Notes

- **Existing Forms**: Continue to work without changes
- **New AI Generation**: Will follow the updated patterns automatically
- **Template Variables**: Work in both old and new form structures
- **Backward Compatibility**: Fully maintained

This update ensures that AI-generated forms are cleaner, more performant, and take full advantage of the new template variable system!
