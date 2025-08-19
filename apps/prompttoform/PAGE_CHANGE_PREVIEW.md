# Page Change Event in Form Preview

The Form Preview panel now includes visual debugging for the `onPageChange` event, allowing you to see page change events in real-time as you navigate through multi-step forms.

## Features

### 1. Current Page Change Event Display
- Shows the most recent page change event in a blue highlighted box
- Displays all relevant information from the `PageChangeEvent` object:
  - **Page ID**: Unique identifier of the current page
  - **Page Title**: Human-readable title of the page
  - **Page Index**: Current page number (1-based) and total pages
  - **Page Type**: Indicates if it's the first page, last page, end page, or confirmation page
  - **Previous Page**: Shows the previous page ID and index (if navigating from another page)
  - **Event Count**: Total number of page change events triggered

### 2. Page Change Event History
- Displays a scrollable list of all page change events
- Shows the page title, step number, and navigation source
- Helps track the user's journey through the form

### 3. Clear Events Button
- Allows you to reset the event tracking for testing
- Useful when you want to start fresh with a new form session

## How to Use

1. **Generate a Multi-Step Form**: Use the AI prompt to generate a form with multiple pages
2. **Switch to Form Preview**: Click on the "Form Preview" tab (or press `1`)
3. **Navigate Through the Form**: Use the Next/Previous buttons to move between pages
4. **Observe Events**: Watch the page change event display update in real-time
5. **Check Console**: Page change events are also logged to the browser console for debugging

## Example Event Data

When you navigate through a form, you'll see events like this:

```javascript
{
  pageId: "personal-info",
  pageIndex: 0,
  pageTitle: "Personal Information",
  totalPages: 3,
  isFirstPage: true,
  isLastPage: false,
  isEndPage: false,
  isConfirmationPage: false,
  previousPageId: undefined,
  previousPageIndex: undefined
}
```

And when navigating to the next page:

```javascript
{
  pageId: "contact-info",
  pageIndex: 1,
  pageTitle: "Contact Information",
  totalPages: 3,
  isFirstPage: false,
  isLastPage: false,
  isEndPage: false,
  isConfirmationPage: false,
  previousPageId: "personal-info",
  previousPageIndex: 0
}
```

## Use Cases

### 1. Form Testing
- Verify that page navigation works correctly
- Check that conditional logic triggers the right pages
- Ensure end pages and confirmation pages are properly identified

### 2. Analytics Development
- Understand the user journey through your forms
- Track which pages users visit and in what order
- Identify potential UX issues in form flow

### 3. Debugging
- Troubleshoot form navigation issues
- Verify that page change events are triggered at the right times
- Check that event data is accurate and complete

## Technical Details

The page change event implementation includes:

- **Event Handler**: `handlePageChange` function that captures and displays events
- **State Management**: Tracks current event and event history
- **Visual Components**: Real-time display of event data
- **Console Logging**: Events are logged to browser console for debugging

## Integration with FormRenderer

The Form Preview uses the same `onPageChange` prop that's available in the `FormRenderer` component:

```tsx
<FormRenderer
  formJson={parsedJson}
  settings={{ showFormSubmissions: true }}
  onPageChange={handlePageChange}
/>
```

This means you can use the same event handling logic in your own applications by implementing the `onPageChange` callback.
