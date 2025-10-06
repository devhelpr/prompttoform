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

The `classes` object allows you to override CSS classes for different form components. **Note: This is the legacy approach. For new projects, use `colorClasses` and `styleClasses` instead.**

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

#### colorClasses and styleClasses (Recommended)

For better organization and maintainability, you can now split CSS classes into two categories:

- **`colorClasses`**: Controls colors, backgrounds, borders, and text colors
- **`styleClasses`**: Controls spacing, sizing, positioning, borders, shadows, etc.

```tsx
<FormRenderer 
  formJson={formDefinition}
  settings={{
    colorClasses: {
      // Color-related classes
      container: 'bg-blue-50',
      header: 'bg-blue-100',
      headerTitle: 'text-blue-800',
      nextButton: 'bg-blue-600 hover:bg-blue-700 text-white',
      previousButton: 'border-blue-300 text-blue-700',
      fieldLabel: 'text-gray-700',
      fieldInput: 'border-gray-300',
      fieldError: 'text-red-500',
      fieldHelperText: 'text-gray-500',
      
      // Error and status colors
      errorMessage: 'text-red-600',
      invalidFormData: 'text-red-600',
      noPagesDefined: 'text-red-600',
      unsupportedComponent: 'text-orange-500',
      
      // Form layout colors
      tableHeader: 'bg-blue-50',
      tableCell: 'text-gray-600',
      requiredIndicator: 'text-red-600',
    },
    styleClasses: {
      // Style and layout classes
      container: 'w-full',
      header: 'p-4 rounded-md',
      headerTitle: 'text-2xl font-bold',
      nextButton: 'px-4 py-2 rounded',
      previousButton: 'px-4 py-2 border rounded',
      field: 'mb-4',
      fieldLabel: 'block text-sm font-medium mb-1',
      fieldInput: 'w-full p-2 border rounded-md',
      fieldError: 'mt-1 text-sm',
      fieldHelperText: 'mt-1 text-sm',
      
      // Error and status styles
      errorMessage: 'p-4 rounded-md',
      invalidFormData: 'p-4 rounded-md',
      noPagesDefined: 'p-4 rounded-md',
      unsupportedComponent: 'text-sm italic',
      
      // Form layout styles
      formLayout: 'mb-6 p-4',
      tableHeader: '',
      tableCell: 'px-4 py-2 text-sm',
      arrayItemContainer: 'flex items-center gap-2 mb-3',
      arrayItemField: 'flex-1',
      requiredIndicator: 'ml-1',
    }
  }}
/>
```

This approach provides several benefits:
- **Better organization**: Separate color and layout concerns
- **Easier theming**: Change colors without affecting layout
- **Improved maintainability**: Clear separation of visual and structural styles
- **Backward compatibility**: Legacy `classes` still works

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

#### texts

The `texts` object allows you to customize all static text in the form:

```tsx
<FormRenderer 
  formJson={formDefinition}
  settings={{
    texts: {
      // Navigation
      stepIndicator: 'Page {currentStep} of {totalSteps}',
      nextButton: 'Continue',
      previousButton: 'Go Back',
      submitButton: 'Send Form',
      confirmSubmitButton: 'Confirm & Send',
      reviewConfirmButton: 'Review & Confirm',
      
      // Form Submissions
      submissionsTitle: 'Submitted Data',
      noSubmissionsText: 'No data submitted yet',
      
      // Thank You Page
      thankYouTitle: '🎉 Success!',
      thankYouMessage: 'Your form has been submitted successfully.',
      restartButton: 'Submit Another Response',
      
      // Form Info
      multiPageInfo: 'This form contains {pageCount} pages',
      
      // Error Messages
      invalidFormData: 'Invalid form data',
      noPagesDefined: 'No pages defined in form',
      invalidPageIndex: 'Invalid page index',
      noContentInSection: 'No content in this section',
    }
  }}
/>
```

**Template Variables**: Some text fields support template variables using `{variableName}` syntax:
- `stepIndicator`: `{currentStep}`, `{totalSteps}`
- `multiPageInfo`: `{pageCount}`

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
    },
    texts: {
      nextButton: 'Continue →',
      previousButton: '← Back',
      stepIndicator: 'Step {currentStep} / {totalSteps}',
      thankYouTitle: '🎉 Success!',
    }
  }}
/>
```

#### Internationalization Example
```tsx
<FormRenderer 
  formJson={formDefinition}
  settings={{
    texts: {
      stepIndicator: 'Página {currentStep} de {totalSteps}',
      nextButton: 'Siguiente',
      previousButton: 'Anterior',
      submitButton: 'Enviar',
      submissionsTitle: 'Datos Enviados',
      thankYouTitle: '¡Gracias!',
      restartButton: 'Enviar Otra Respuesta',
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


