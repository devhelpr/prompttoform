# Thank You Page Feature

The FormRenderer component now supports an optional thank you page that can be displayed after a successful form submission. This feature allows you to provide users with confirmation, next steps, or additional actions after they complete your form.

## Configuration

To enable a thank you page, add a `thankYouPage` property to your form definition:

```typescript
const formWithThankYou: FormDefinition = {
  app: {
    title: "My Form",
    pages: [
      // ... your form pages
    ],
    thankYouPage: {
      title: "Thank You!",
      message: "Your form has been submitted successfully.",
      showRestartButton: true,
      showBackButton: false,
      customActions: [
        {
          label: "Visit Our Website",
          action: "custom",
          customAction: "visit-website",
          className: "bg-green-600 text-white hover:bg-green-700"
        }
      ]
    }
  }
};
```

## ThankYouPage Properties

### `title?: string`
The title displayed at the top of the thank you page. Defaults to "Thank You!" if not provided.

### `message?: string`
The main message displayed to the user after form submission.

### `components?: FormComponentFieldProps[]`
Optional array of form components to display on the thank you page. This can include:
- Text components for additional information
- HTML components for rich content
- Buttons for custom actions
- Any other supported form components

### `showRestartButton?: boolean`
If `true`, displays a "Start New Form" button that resets the form and allows users to fill it out again.

### `showBackButton?: boolean`
If `true`, displays a "Go Back" button that returns users to the form with their previous values intact.

### `customActions?: Array<CustomAction>`
Array of custom action buttons with the following properties:

```typescript
interface CustomAction {
  label: string;                    // Button text
  action: 'restart' | 'back' | 'custom';
  customAction?: string;            // Custom action identifier
  className?: string;               // Custom CSS classes
}
```

## Example Usage

Here's a complete example of a form with a thank you page:

```typescript
import { FormRenderer, thankYouFormExample } from '@devhelpr/react-forms';

function MyForm() {
  const handleSubmit = (formValues: FormValues) => {
    console.log('Form submitted:', formValues);
    // Handle form submission (e.g., send to API)
  };

  return (
    <FormRenderer
      formJson={thankYouFormExample}
      onSubmit={handleSubmit}
    />
  );
}
```

## Behavior

1. **Form Submission**: When a user submits a form with a configured thank you page, the form data is processed and the thank you page is displayed.

2. **Navigation Options**:
   - **Restart**: Clears all form data and returns to the first page
   - **Back**: Returns to the form with previous values preserved
   - **Custom Actions**: Can be handled in your application logic

3. **No Thank You Page**: If no thank you page is configured, the form behaves as before - it resets and returns to the first page.

## Styling

The thank you page uses Tailwind CSS classes and follows the same design patterns as the rest of the form. You can customize the appearance by:

1. Modifying the default classes in the `renderThankYouPage` method
2. Using custom CSS classes in the `customActions` configuration
3. Adding custom components with your own styling

## Testing

The feature includes comprehensive tests in `FormRenderer.thank-you.test.tsx` that cover:
- Thank you page display after submission
- Restart functionality
- Back navigation
- Behavior when no thank you page is configured

## Migration

This feature is backward compatible. Existing forms without a `thankYouPage` configuration will continue to work exactly as before. 