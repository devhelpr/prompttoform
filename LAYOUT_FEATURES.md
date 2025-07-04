# Layout Features

## Overview

The Form Generator features a dynamic layout system that adapts based on user interaction and content generation. The layout uses CSS view transitions to provide smooth animations while ensuring textarea focus is maintained during user input. The system is designed to provide an optimal user experience across different screen sizes and interaction states.

## Layout States

### Single Column Layout
- **When**: Initial state, no generated content
- **Features**: 
  - Full-width prompt input area
  - Centered content with optimal readability
  - Clean, focused interface for initial form generation

### Two-Column Layout
- **When**: After form generation
- **Features**:
  - Left sidebar with prompt input and controls
  - Right main content area with form preview
  - Responsive design that adapts to screen size

## View Transitions

The layout uses the CSS View Transitions API to provide smooth animations between layout states. These transitions are carefully implemented to prevent focus loss in textareas during user input.

### Supported Transitions
- **Layout Changes**: Smooth transition from single-column to two-column layout
- **Sidebar Animations**: Elegant slide-in/out effects for the sidebar
- **Content Fade Effects**: Smooth content transitions between different view modes

### Browser Support
- **Modern Browsers**: Full support for view transitions with smooth animations
- **Older Browsers**: Graceful fallback to CSS transitions

## Responsive Design

### Desktop Layout
- **Large Screens**: Two-column layout with fixed sidebar width
- **Medium Screens**: Adaptive layout with optimized spacing
- **Animations**: Smooth view transitions for layout changes

### Mobile Layout
- **Small Screens**: Single-column layout for optimal mobile experience
- **Touch Interactions**: Optimized for touch input
- **Performance**: Efficient rendering and transitions

## Key Features

### Dynamic Layout Switching
- Automatic transition between single and two-column layouts
- Smooth animations using CSS view transitions
- Maintains user focus and input state

### Enhanced User Experience
- **No Focus Loss**: Textareas maintain focus during typing
- **Smooth Transitions**: Elegant animations between layout states
- **Responsive Design**: Optimal experience across all device sizes

### Accessibility Considerations
- **Keyboard Navigation**: Full keyboard support maintained
- **Screen Readers**: Proper ARIA labels and semantic structure
- **Focus Management**: Careful focus handling during transitions

## Technical Implementation

### Component Architecture
The layout is implemented using a component-based architecture that prevents unnecessary re-renders:

```typescript
// Components moved outside main component to prevent re-rendering
const SidebarContent = ({ prompt, updatePrompt, ...props }: SidebarContentProps) => (
  // Sidebar content implementation
);

const MainContent = ({ viewMode, generatedJson, ...props }: MainContentProps) => (
  // Main content implementation
);

export function FormGenerator() {
  // State management and event handlers
  return (
    <div className="h-screen flex flex-col">
      {/* Layout implementation */}
    </div>
  );
}
```

### CSS View Transitions
```css
/* View transition names for layout elements */
.view-transition-layout {
  view-transition-name: layout-transition;
}

.sidebar {
  view-transition-name: sidebar-transition;
}

.main-content {
  view-transition-name: main-content-transition;
}

.single-column {
  view-transition-name: single-column-transition;
}
```

### React State Management
- **Layout State**: Determined by `hasGeneratedContent` boolean
- **View Modes**: Form preview, JSON editor, flow diagrams
- **User Input**: Maintained across layout transitions

## Usage Scenarios

### Initial Form Generation
1. User enters prompt in single-column layout
2. Clicks "Generate UI/Form" button
3. Layout smoothly transitions to two-column view
4. Generated form appears in main content area

### Form Updates
1. User modifies prompt in sidebar
2. Clicks "Update Form" button
3. Form updates without layout changes
4. Focus maintained in textareas throughout

### View Mode Switching
1. User switches between Form Preview, Visual Flow, and JSON views
2. Content transitions smoothly
3. Layout remains stable
4. No focus loss in input fields

## Browser Compatibility

### Full Support
- Chrome 111+
- Edge 111+
- Safari 16.4+

### Partial Support
- Firefox (CSS transitions fallback)
- Older browsers (graceful degradation)

## Benefits

### User Experience
- **Smooth Interactions**: No jarring layout changes
- **Maintained Focus**: Textareas stay focused during typing
- **Intuitive Flow**: Natural progression from input to output

### Technical Benefits
- **Performance**: Efficient rendering with minimal re-renders
- **Maintainability**: Clean component separation
- **Scalability**: Easy to extend with new features

### Accessibility
- **Keyboard Navigation**: Full support maintained
- **Screen Readers**: Proper semantic structure
- **Focus Management**: Careful handling of focus states 