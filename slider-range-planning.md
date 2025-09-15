# Slider-Range Input Implementation Plan

## Overview
This document outlines the implementation plan for adding a new `slider-range` input type to the FormRenderer system. The slider-range component will allow users to select a range of values between a minimum and maximum value using dual handles on a slider track.

## Current System Analysis

### Existing Input Types
The FormRenderer currently supports these input types:
- `text` - Static text display
- `input` - Single-line text input (text, email, number, password)
- `textarea` - Multi-line text input
- `checkbox` - Boolean or multiple choice selections
- `radio` - Single selection from multiple options
- `select` - Dropdown selections
- `date` - Date input fields
- `button` - User actions
- `table` - Tabular data display
- `form` - Form grouping
- `section` - Component grouping
- `array` - Dynamic array fields
- `html` - HTML content
- `decisionTree` - Decision tree logic
- `confirmation` - Form summary/confirmation

### Architecture Components
1. **Field Types** (`libs/react-forms/src/lib/types/field-types.ts`)
2. **Form Interfaces** (`libs/react-forms/src/lib/interfaces/form-interfaces.ts`)
3. **Form Components** (`libs/react-forms/src/lib/atoms/`)
4. **Form Renderer** (`libs/react-forms/src/lib/molecules/FormRenderer.tsx`)
5. **Schema Definition** (`schema.json`)
6. **System Prompt** (`apps/prompttoform/src/app/prompt-library/system-prompt.ts`)

## Implementation Plan

### Phase 1: Core Component Development

#### 1.1 Add Slider-Range to Field Types
**File**: `libs/react-forms/src/lib/types/field-types.ts`
- Add `'slider-range'` to the `FieldType` union type

#### 1.2 Create Slider-Range Component
**File**: `libs/react-forms/src/lib/atoms/form-slider-range-field.tsx`
- Create a new React component for the slider-range input
- Support dual handles for range selection
- Include proper accessibility features (ARIA labels, keyboard navigation)
- Use Tailwind CSS for styling following the existing design system
- Support the following props:
  - `fieldId`: Unique identifier
  - `label`: Field label
  - `value`: Current range value (object with `min` and `max` properties)
  - `onChange`: Callback for value changes
  - `onBlur`: Callback for blur events
  - `validation`: Validation rules
  - `props`: Additional properties including:
    - `min`: Minimum value of the range
    - `max`: Maximum value of the range
    - `step`: Step size for value increments
    - `helperText`: Helper text for the field
    - `showLabels`: Whether to show min/max labels
    - `showValue`: Whether to show current values
    - `disabled`: Disabled state
  - `showError`: Error display state
  - `validationErrors`: Array of error messages
  - `classes`: Custom CSS classes

#### 1.3 Update Form Interfaces
**File**: `libs/react-forms/src/lib/interfaces/form-interfaces.ts`
- Add slider-range specific props to `FormComponentFieldProps`:
  - `minValue?: number` - Minimum value for the range
  - `maxValue?: number` - Maximum value for the range
  - `step?: number` - Step size for increments
  - `showLabels?: boolean` - Show min/max labels
  - `showValue?: boolean` - Show current values
- Add validation rules for range validation:
  - `minRange?: number` - Minimum range span
  - `maxRange?: number` - Maximum range span
  - `minValueMin?: number` - Minimum value for the minimum handle
  - `minValueMax?: number` - Maximum value for the minimum handle
  - `maxValueMin?: number` - Minimum value for the maximum handle
  - `maxValueMax?: number` - Maximum value for the maximum handle

#### 1.4 Update Form Renderer
**File**: `libs/react-forms/src/lib/molecules/FormRenderer.tsx`
- Add import for the new `FormSliderRangeField` component
- Add case for `'slider-range'` in the `renderComponent` function
- Add validation logic for range-specific validation rules
- Handle range value changes and updates to form state

#### 1.5 Update Component Exports
**File**: `libs/react-forms/src/lib/atoms/index.tsx`
- Export the new `FormSliderRangeField` component

### Phase 2: Schema and Validation Updates

#### 2.1 Update JSON Schema
**File**: `schema.json`
- Add `sliderRangeComponent` definition to the schema
- Include all necessary properties for slider-range configuration
- Add validation rules for range-specific validation
- Update the component `oneOf` array to include the new component type

#### 2.2 Update Validation Logic
**File**: `libs/react-forms/src/lib/molecules/FormRenderer.tsx`
- Add validation for range-specific rules:
  - `minRange`: Ensure the range span meets minimum requirements
  - `maxRange`: Ensure the range span doesn't exceed maximum
  - `minValueMin`/`minValueMax`: Validate minimum handle position
  - `maxValueMin`/`maxValueMax`: Validate maximum handle position
- Add appropriate error messages for range validation failures

### Phase 3: System Prompt and AI Integration

#### 3.1 Update System Prompt
**File**: `apps/prompttoform/src/app/prompt-library/system-prompt.ts`
- Add guidance for when to use slider-range components
- Include examples of proper slider-range configuration
- Add validation examples for range-specific rules
- Update the component type descriptions section

#### 3.2 Update Translation Service
**File**: `libs/react-forms/src/lib/services/translation-service.ts`
- Add support for translating slider-range specific text
- Include range validation error messages in translation support

### Phase 4: Vanilla Form Support

#### 4.1 Update Vanilla Form Core
**File**: `apps/prompttoform/src/app/vanilla/VanillaFormCore.ts`
- Add `createSliderRange` method for vanilla form support
- Implement range slider functionality using native HTML range inputs
- Add proper event handling for dual-range selection
- Include accessibility features for vanilla implementation

#### 4.2 Update Vanilla Types
**File**: `apps/prompttoform/src/app/vanilla/types.ts`
- Add slider-range support to the vanilla form types
- Include range-specific properties and validation

## Technical Specifications

### Slider-Range Component Features

#### Core Functionality
- Dual-handle range selection
- Smooth dragging with mouse and touch support
- Keyboard navigation (arrow keys, page up/down, home/end)
- Value display with optional labels
- Configurable step size and range bounds

#### Accessibility Features
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

#### Styling and Theming
- Tailwind CSS classes for consistent styling
- Customizable color schemes
- Responsive design for mobile devices
- Dark mode support

#### Validation Features
- Range span validation (min/max range)
- Individual handle position validation
- Required field validation
- Custom error messages
- Real-time validation feedback

### Data Structure

#### Value Format
```typescript
interface SliderRangeValue {
  min: number;
  max: number;
}
```

#### Component Props
```typescript
interface SliderRangeProps {
  fieldId: string;
  label?: string;
  value: SliderRangeValue;
  onChange: (value: SliderRangeValue) => void;
  onBlur: () => void;
  validation?: {
    required?: boolean;
    minRange?: number;
    maxRange?: number;
    minValueMin?: number;
    minValueMax?: number;
    maxValueMin?: number;
    maxValueMax?: number;
    errorMessages?: {
      required?: string;
      minRange?: string;
      maxRange?: string;
      minValueMin?: string;
      minValueMax?: string;
      maxValueMin?: string;
      maxValueMax?: string;
    };
  };
  props?: {
    min?: number;
    max?: number;
    step?: number;
    showLabels?: boolean;
    showValue?: boolean;
    helperText?: string;
    disabled?: boolean;
  };
  showError: boolean;
  validationErrors: string[];
  classes?: {
    field?: string;
    fieldLabel?: string;
    fieldSlider?: string;
    fieldError?: string;
    fieldHelperText?: string;
  };
}
```

### JSON Schema Example

```json
{
  "type": "slider-range",
  "id": "priceRange",
  "label": "Price Range",
  "props": {
    "min": 0,
    "max": 1000,
    "step": 10,
    "showLabels": true,
    "showValue": true,
    "helperText": "Select your preferred price range"
  },
  "validation": {
    "required": true,
    "minRange": 50,
    "maxRange": 500,
    "errorMessages": {
      "required": "Please select a price range",
      "minRange": "Price range must be at least {minRange}",
      "maxRange": "Price range cannot exceed {maxRange}"
    }
  }
}
```

## Implementation Timeline

### Week 1: Core Component Development
- [ ] Add slider-range to field types
- [ ] Create FormSliderRangeField component
- [ ] Update form interfaces
- [ ] Basic component functionality

### Week 2: Form Integration
- [ ] Update FormRenderer with slider-range support
- [ ] Add validation logic
- [ ] Update component exports
- [ ] Basic testing

### Week 3: Schema and AI Integration
- [ ] Update JSON schema
- [ ] Update system prompt
- [ ] Add translation support
- [ ] Integration testing

### Week 4: Vanilla Support and Polish
- [ ] Add vanilla form support
- [ ] Accessibility improvements
- [ ] Documentation updates
- [ ] Final testing and bug fixes

## Success Criteria

1. **Functionality**: Slider-range component works correctly with dual handles
2. **Validation**: All range-specific validation rules work properly
3. **Accessibility**: Component is fully accessible with keyboard navigation and screen readers
4. **Integration**: Component integrates seamlessly with existing FormRenderer
5. **AI Support**: System prompt generates appropriate slider-range components
6. **Schema**: JSON schema supports all slider-range properties and validation
7. **Documentation**: Complete documentation and examples provided
8. **Testing**: Comprehensive test coverage for all functionality

## Risk Assessment

### Technical Risks
- **Complexity**: Dual-handle slider implementation may be complex
- **Accessibility**: Ensuring proper accessibility for range sliders
- **Browser Compatibility**: Range input support varies across browsers
- **Mobile Support**: Touch interactions for dual handles

### Mitigation Strategies
- Use proven slider libraries as reference
- Implement comprehensive accessibility testing
- Provide fallback for unsupported browsers
- Test extensively on mobile devices

## Future Enhancements

1. **Custom Styling**: Allow custom track and handle styling
2. **Animation**: Smooth animations for value changes
3. **Tooltips**: Value tooltips on hover/focus
4. **Marks**: Optional tick marks on the slider track
5. **Multiple Ranges**: Support for multiple range selections
6. **Custom Labels**: Custom labels for specific values
7. **Value Formatting**: Custom formatting for displayed values

## Conclusion

This implementation plan provides a comprehensive approach to adding slider-range input functionality to the FormRenderer system. The phased approach ensures proper integration with existing components while maintaining code quality and accessibility standards. The implementation will significantly enhance the form generation capabilities by providing a more intuitive way for users to select ranges of values.
