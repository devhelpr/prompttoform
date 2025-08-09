# Template Variable Example - Direct Field IDs

## User's Requested Format

The AI should generate forms that produce summaries like this:

```
Name
{{fullName}}

Email
{{email}}

Phone
{{phone}}

Date of birth
{{dob}}

Health summary
Height: {{heightCm}} cm • Weight: {{weightKg}} kg • Smoker: {{smoker}}

Pre-existing conditions
{{preExistingConditions}}
```

## Correct Form Structure

To achieve this, the AI should generate:

### 1. Simple Field IDs in Form Components

```json
{
  "id": "fullName",
  "type": "input",
  "label": "Full Name",
  "validation": { "required": true }
},
{
  "id": "email", 
  "type": "input",
  "label": "Email Address",
  "props": { "inputType": "email" }
},
{
  "id": "phone",
  "type": "input", 
  "label": "Phone Number"
},
{
  "id": "dob",
  "type": "date",
  "label": "Date of Birth"
},
{
  "id": "heightCm",
  "type": "input",
  "label": "Height (cm)",
  "props": { "inputType": "number" }
},
{
  "id": "weightKg", 
  "type": "input",
  "label": "Weight (kg)",
  "props": { "inputType": "number" }
},
{
  "id": "smoker",
  "type": "radio",
  "label": "Do you smoke?",
  "props": {
    "options": [
      { "label": "Yes", "value": "yes" },
      { "label": "No", "value": "no" }
    ]
  }
},
{
  "id": "preExistingConditions",
  "type": "textarea",
  "label": "Pre-existing conditions",
  "props": { "placeholder": "List any medical conditions..." }
}
```

### 2. Summary Page with Direct Template Variables

```json
{
  "id": "summary",
  "title": "Review Your Information",
  "components": [
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
  ]
}
```

## Key Rules for AI Generation

### ✅ CORRECT Patterns:

1. **Direct Field IDs**: `{{fullName}}`, `{{email}}`, `{{heightCm}}`
2. **Descriptive Names**: Use clear, descriptive field IDs
3. **No Bindings**: Just simple field IDs, no binding objects
4. **Multi-line Formatting**: Use `\n` for line breaks in helperText

### ❌ INCORRECT Patterns:

1. **Nested Paths**: `{{applicant.fullName}}`, `{{health.smoker}}`
2. **Complex Bindings**: `"bindings": { "field": "user.name" }`
3. **Underscores/Hyphens**: `{{full_name}}`, `{{user-email}}`

## Runtime Behavior

When the form is filled out:

**Input Values:**
```javascript
{
  fullName: "John Smith",
  email: "john@example.com", 
  phone: "+1234567890",
  dob: "1990-05-15",
  heightCm: "175",
  weightKg: "70", 
  smoker: "no",
  preExistingConditions: "None"
}
```

**Rendered Summary:**
```
Name
John Smith

Email
john@example.com

Phone
+1234567890

Date of birth
1990-05-15

Health summary
Height: 175 cm • Weight: 70 kg • Smoker: no

Pre-existing conditions
None
```

**Missing Fields Show "-":**
```
Name
John Smith

Email
john@example.com

Phone
-

Date of birth
-

Health summary
Height: 175 cm • Weight: 70 kg • Smoker: no

Pre-existing conditions
-
```

This approach ensures clean, professional forms with dynamic summaries that work exactly as requested!
