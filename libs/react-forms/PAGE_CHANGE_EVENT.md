# Page Change Event

The FormRenderer now supports a new `onPageChange` event that is triggered whenever a user navigates to a new page in a multi-step form.

## Usage

```tsx
import { FormRenderer } from '@devhelpr/react-forms';
import { PageChangeEvent } from '@devhelpr/react-forms';

const MyForm = () => {
  const handlePageChange = (event: PageChangeEvent) => {
    console.log('Page changed:', event);
    // Handle page change logic here
  };

  return (
    <FormRenderer
      formJson={myFormDefinition}
      onSubmit={handleSubmit}
      onPageChange={handlePageChange}
    />
  );
};
```

## Event Object

The `PageChangeEvent` object contains the following properties:

```typescript
interface PageChangeEvent {
  pageId: string;           // Unique identifier of the current page
  pageIndex: number;        // Zero-based index of the current page
  pageTitle: string;        // Title of the current page
  totalPages: number;       // Total number of pages in the form
  isFirstPage: boolean;     // Whether this is the first page
  isLastPage: boolean;      // Whether this is the last page
  isEndPage: boolean;       // Whether this page is marked as an end page
  isConfirmationPage: boolean; // Whether this page is a confirmation page
  previousPageId?: string;  // ID of the previous page (if navigating from another page)
  previousPageIndex?: number; // Index of the previous page (if navigating from another page)
}
```

## When the Event is Triggered

The `onPageChange` event is triggered in the following scenarios:

1. **Initial render**: When the form first loads, the event is triggered for the first page
2. **Next navigation**: When the user clicks the "Next" button and moves to the next page
3. **Previous navigation**: When the user clicks the "Previous" button and moves back
4. **Form reset**: When the form is reset to the first page
5. **Conditional navigation**: When the form navigates based on conditional logic

## Example Use Cases

### Analytics Tracking
```tsx
const handlePageChange = (event: PageChangeEvent) => {
  // Track page views for analytics
  analytics.track('form_page_view', {
    pageId: event.pageId,
    pageTitle: event.pageTitle,
    stepNumber: event.pageIndex + 1,
    totalSteps: event.totalPages
  });
};
```

### Progress Tracking
```tsx
const handlePageChange = (event: PageChangeEvent) => {
  // Update progress indicator
  const progress = ((event.pageIndex + 1) / event.totalPages) * 100;
  setProgress(progress);
  
  // Show different UI based on page type
  if (event.isConfirmationPage) {
    setShowReviewMode(true);
  }
};
```

### Form State Management
```tsx
const handlePageChange = (event: PageChangeEvent) => {
  // Save current page to localStorage for form recovery
  localStorage.setItem('currentFormPage', event.pageId);
  
  // Update breadcrumb navigation
  setBreadcrumbs(prev => [...prev, {
    id: event.pageId,
    title: event.pageTitle,
    index: event.pageIndex
  }]);
};
```

### Conditional Logic
```tsx
const handlePageChange = (event: PageChangeEvent) => {
  // Show different help content based on page
  if (event.pageId === 'personal-info') {
    setHelpContent('Please provide your basic information');
  } else if (event.pageId === 'contact-info') {
    setHelpContent('We need this to contact you about your application');
  }
  
  // Enable/disable certain features based on page type
  if (event.isConfirmationPage) {
    setShowSaveDraftButton(false);
  }
};
```

## Optional Event Handler

The `onPageChange` prop is optional. If not provided, the FormRenderer will function normally without triggering any page change events.

## Testing

You can test the page change event by providing a mock function:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FormRenderer } from './FormRenderer';

test('should trigger page change event', () => {
  const mockOnPageChange = vi.fn();
  
  render(
    <FormRenderer
      formJson={testForm}
      onPageChange={mockOnPageChange}
    />
  );
  
  // Initial page change event should be triggered
  expect(mockOnPageChange).toHaveBeenCalledWith({
    pageId: 'page1',
    pageIndex: 0,
    pageTitle: 'First Page',
    totalPages: 3,
    isFirstPage: true,
    isLastPage: false,
    isEndPage: false,
    isConfirmationPage: false,
    previousPageId: undefined,
    previousPageIndex: undefined,
  });
});
```

## Migration Guide

This is a new feature that doesn't break existing functionality. To add page change tracking to existing forms:

1. Add the `onPageChange` prop to your FormRenderer component
2. Implement your page change handler function
3. The event will automatically be triggered for all page navigation

No changes to existing form definitions or other props are required.
