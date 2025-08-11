# Form Confirmation Feature

The form confirmation feature allows you to add a comprehensive form summary that can be displayed before final submission, giving users a chance to review all their inputs before submitting.

## Overview

This feature adds:
- A new `confirmation` field type
- Support for `isConfirmationPage` flag in page configuration
- Automatic form data collection and display across all pages
- Customizable confirmation settings and styling

## Usage

### 1. Add a Confirmation Page

```typescript
const formDefinition: FormDefinition = {
  app: {
    title: "Sample Form",
    pages: [
      // ... your regular form pages
      {
        id: 'confirmation',
        title: 'Review & Confirm',
        route: '/confirmation',
        isConfirmationPage: true, // This makes it a confirmation page
        components: [
          {
            type: 'confirmation',
            id: 'form-summary',
            label: 'Form Summary',
            props: {
              confirmationSettings: {
                showSummary: true,
                groupBySection: true,
                customTitle: 'Please Review Your Information',
                customMessage: 'Please verify that all information is correct before submitting.',
                excludeFields: ['password', 'confirmPassword'], // Optional: exclude sensitive fields
              },
            },
          },
        ],
      },
    ],
  },
};
```

### 2. Configuration Options

The `confirmationSettings` prop supports the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showSummary` | boolean | `true` | Whether to show the detailed form summary |
| `groupBySection` | boolean | `false` | Group form fields by their parent sections |
| `excludeFields` | string[] | `[]` | Array of field IDs to exclude from the summary |
| `customTitle` | string | `'Please Review Your Information'` | Custom title for the confirmation page |
| `customMessage` | string | `'Please review the information...'` | Custom message displayed above the summary |

### 3. Navigation Behavior

When `isConfirmationPage: true` is set:
- The "Next" button on the previous page will show "Review & Confirm"
- The "Next" button on the confirmation page will show "Confirm & Submit"
- Clicking "Confirm & Submit" will trigger the form submission

## Data Display

The confirmation component automatically handles different field types:

### Text Fields (input, textarea)
Displays the entered text value.

### Radio Buttons
Shows the selected option's label (not the value).

### Checkboxes
- Single checkbox: Shows "Yes" or "No"
- Multiple checkboxes: Shows comma-separated list of selected option labels

### Select Fields
Shows the selected option's label (not the value).

### Date Fields
Formats dates using `toLocaleDateString()` for better readability.

### Array Fields
Shows count of items (e.g., "3 items").

### Empty Values
Shows "Not provided" for empty or undefined values.

## Example Implementation

```typescript
import React from 'react';
import { FormRenderer } from '@your-org/react-forms';

const MyFormWithConfirmation = () => {
  const formDefinition = {
    app: {
      title: 'User Registration',
      pages: [
        {
          id: 'personal-info',
          title: 'Personal Information',
          route: '/personal',
          components: [
            {
              type: 'input',
              id: 'firstName',
              label: 'First Name',
              validation: { required: true },
            },
            {
              type: 'input',
              id: 'lastName',
              label: 'Last Name',
              validation: { required: true },
            },
            {
              type: 'radio',
              id: 'gender',
              label: 'Gender',
              options: [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' },
              ],
            },
          ],
          nextPage: 'confirmation',
        },
        {
          id: 'confirmation',
          title: 'Review Your Information',
          route: '/confirmation',
          isConfirmationPage: true,
          components: [
            {
              type: 'confirmation',
              id: 'summary',
              props: {
                confirmationSettings: {
                  showSummary: true,
                  customTitle: 'Please Review Your Registration',
                  customMessage: 'Make sure all information is correct.',
                },
              },
            },
          ],
        },
      ],
    },
  };

  const handleSubmit = (formData) => {
    console.log('Form submitted:', formData);
    // Handle form submission
  };

  return <FormRenderer formJson={formDefinition} onSubmit={handleSubmit} />;
};
```

## Styling

The confirmation component uses Tailwind CSS classes and follows the design system of the existing form components. It includes:

- Clean card-based layout with borders and shadows
- Proper spacing and typography
- Responsive design that works on mobile and desktop
- Visual indicators and status messages

## Technical Details

### New Field Type
- Added `"confirmation"` to the `FieldType` union type
- Added support in `FormRenderer.renderComponent()` switch statement

### New Page Property
- Added optional `isConfirmationPage?: boolean` to `PageProps` interface
- Updated navigation logic to handle confirmation pages

### Component Structure
- `FormConfirmationField`: The main confirmation component
- Recursive form data extraction across all pages and components
- Smart value formatting for different field types
- Section grouping capability

### Data Collection
The confirmation component automatically:
1. Collects all form components from all pages
2. Extracts current form values
3. Matches values to their corresponding components
4. Formats values appropriately for display
5. Groups by sections if requested
6. Excludes specified fields

This feature provides a complete solution for form confirmation workflows, enhancing user experience by allowing review before submission.
