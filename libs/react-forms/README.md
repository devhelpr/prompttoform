# react-forms

React Forms is a library for building forms with React.

## Installation

```bash
npm install react-forms
```

## Usage

```tsx
import { FormRenderer } from 'react-forms';

<FormRenderer formJson={formDefinition} />
```

FormJson is a JSON object that follows the https://prompttoform.ai/schema/v0.1/schema.json schema. Forms can be generated with https://app.prompttoform.ai

## Props

### FormRendererProps

- `formJson: FormDefinition` - The form definition object
- `onSubmit?: (formValues: FormValues) => void` - Callback function called when the form is submitted
- `disabled?: boolean` - When true, disables all form fields and hides navigation buttons (default: false)
- `prefixId?: string` - When provided, prefixes all field IDs with the specified value (e.g., "my-form" becomes "my-form-field-name")
- `settings?: FormRendererSettings` - Optional settings object for configuring form behavior

## Features

### Disabled State

When the `disabled` prop is set to `true`:
- All form fields (inputs, textareas, selects, checkboxes, radio buttons, date fields) are disabled
- Next/Previous navigation buttons are hidden
- Form submission buttons are hidden
- Array field add/remove buttons are disabled
- Custom buttons are disabled

### Step Indicator

The step indicator is automatically hidden when:
- The form has only one page
- The form has no pages

This provides a cleaner UI for single-page forms.

### ID Prefixing

When the `prefixId` prop is provided:
- All form field IDs are prefixed with the specified value
- Nested fields (inside sections) maintain their hierarchical structure with the prefix
- Useful for avoiding ID conflicts when multiple forms are rendered on the same page
- Example: `prefixId="user-form"` results in IDs like `user-form-name`, `user-form-email`, etc.

### Form Settings

The `settings` object allows you to configure various form behaviors:

#### showFormSubmissions

When `settings.showFormSubmissions` is set to `true`:
- After form submission, a "Form Submissions" section appears below the form
- Shows all submitted form data in a formatted JSON display
- Useful for debugging and development purposes
- Only displays when there are actual submissions and the form is not disabled
- Commonly used in form preview/development environments

Example:
```tsx
<FormRenderer 
  formJson={formDefinition} 
  settings={{ showFormSubmissions: true }}
/>
```

## Requirements

- Tailwind CSS is required for styling

If you use Tailwind v4, add this to your main CSS file:

```css
@source "../node_modules/@devhelpr/react-forms";
```


