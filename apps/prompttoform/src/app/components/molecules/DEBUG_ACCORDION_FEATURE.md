# Form Debug Information Accordion

## Overview

The Form Preview panel now includes a collapsible debug information accordion that combines both the current page change event display and the page change event history into a single, organized section.

## Features

### 🔍 Form Debug Information Accordion

- **Location**: Below the form preview, collapsed by default
- **Title**: "🔍 Form Debug Information" with a magnifying glass icon
- **Default State**: Collapsed to keep the interface clean
- **Accessibility**: Keyboard accessible with proper focus management

### Current Page Change Event Section

When a page change event occurs, the accordion displays:

- **Page ID**: The unique identifier of the current page
- **Page Title**: The human-readable title of the page
- **Page Index**: Current step number and total pages (e.g., "2 of 5")
- **Page Type**: Special indicators for first page, last page, end page, or confirmation page
- **Previous Page Information**: ID and index of the previous page (if applicable)
- **Event Statistics**: Total pages and event count
- **Clear Events Button**: Red button to reset all event tracking

### Page Change Event History Section

Shows a scrollable list of all page change events that have occurred:

- **Event Count**: Number of events in parentheses
- **Event Details**: Each event shows page title, step number, and navigation source
- **Scrollable**: Limited height with vertical scrolling for many events
- **Visual Hierarchy**: Clear separation between current event and history

## Implementation Details

### Accordion Component

```typescript
interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}
```

- **Custom Component**: Built specifically for this use case
- **Smooth Animations**: Chevron rotation and content transitions
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: Proper ARIA attributes and keyboard navigation

### Styling

- **Consistent Design**: Matches the existing UI design system
- **Color Coding**: Blue background for current event, gray for history
- **Visual Hierarchy**: Clear section headers and organized layout
- **Responsive Grid**: Two-column layout on larger screens

## Usage

1. **Navigate through the form** to trigger page change events
2. **Click the accordion header** to expand the debug information
3. **View current event details** in the blue-highlighted section
4. **Scroll through event history** to see all previous events
5. **Click "Clear Events"** to reset the tracking when needed

## Benefits

- **Cleaner Interface**: Debug information is hidden by default
- **Better Organization**: Related information is grouped together
- **Reduced Clutter**: No longer takes up space when not needed
- **Improved UX**: Users can focus on the form while having easy access to debug info
- **Professional Appearance**: More polished and organized layout

## Technical Notes

- **State Management**: Uses React hooks for accordion state
- **Event Tracking**: Maintains both current event and history arrays
- **Performance**: Efficient rendering with proper key props
- **TypeScript**: Fully typed with proper interfaces
