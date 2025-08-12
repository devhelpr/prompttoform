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

#### classes

The `classes` object allows you to override CSS classes for different form components:

```tsx
<FormRenderer 
  formJson={formDefinition}
  settings={{
    classes: {
      // Layout
      container: 'w-full bg-blue-50 p-4',
      header: 'bg-blue-100 p-4 rounded-md',
      page: 'bg-white rounded-lg shadow-md p-6',
      
      // Navigation
      stepIndicator: 'mb-4 flex items-center',
      nextButton: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded',
      previousButton: 'bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded',
      
      // Form Fields
      field: 'mb-4',
      fieldLabel: 'block text-sm font-medium text-gray-700 mb-1',
      fieldInput: 'w-full p-2 border border-gray-300 rounded-md',
      fieldError: 'mt-1 text-sm text-red-500',
      fieldHelperText: 'mt-1 text-sm text-gray-500',
      
      // Submissions
      submissionsContainer: 'mt-8 border-t pt-6',
      submissionsTitle: 'text-lg font-medium mb-4',
      submissionsData: 'bg-gray-50 p-4 rounded-md',
    }
  }}
/>
```

#### theme

The `theme` object allows you to customize colors and spacing using CSS variables:

```tsx
<FormRenderer 
  formJson={formDefinition}
  settings={{
    theme: {
      colors: {
        primary: '#8b5cf6',
        secondary: '#64748b',
        error: '#ef4444',
        success: '#10b981',
        background: '#f8fafc',
        text: '#1e293b',
        border: '#e2e8f0',
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
      },
    }
  }}
/>
```

### Styling Examples

#### Simple Override (just change colors)
```tsx
<FormRenderer 
  formJson={formDefinition}
  settings={{
    classes: {
      nextButton: 'bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md',
      header: 'bg-green-50 p-4 rounded-md',
    }
  }}
/>
```

#### Complete Style Replacement (Bootstrap)
```tsx
<FormRenderer 
  formJson={formDefinition}
  settings={{
    classes: {
      container: 'container-fluid',
      header: 'alert alert-info',
      field: 'form-group',
      fieldInput: 'form-control',
      fieldError: 'invalid-feedback',
      nextButton: 'btn btn-primary',
      previousButton: 'btn btn-secondary',
    }
  }}
/>
```

#### Theme-based Styling
```tsx
<FormRenderer 
  formJson={formDefinition}
  settings={{
    theme: {
      colors: {
        primary: '#8b5cf6',
        error: '#ef4444',
      }
    },
    classes: {
      header: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg',
      nextButton: 'bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg',
    }
  }}
/>
```

## Requirements

- Tailwind CSS is required for styling

If you use Tailwind v4, add this to your main CSS file:

```css
@source "../node_modules/@devhelpr/react-forms";
```


