# Expression Engine Guide for Form Generation

## Overview

The form generation system now supports powerful expression-based calculations that enable dynamic, real-time field updates based on user input. This guide explains how to use expressions in generated forms, particularly for calculations involving sliders and other input types.

## Expression Syntax

### Field References

Expressions reference form field values using the pattern: `fieldId.value`

```javascript
// Examples
"price.value"           // Single field value
"quantity.value"        // Slider value
"budgetRange.value.min" // Range slider minimum
"budgetRange.value.max" // Range slider maximum
```

### Mathematical Operations

```javascript
// Basic arithmetic
"price.value * quantity.value"
"subtotal.value + tax.value"
"total.value - discount.value"

// Advanced calculations
"Math.round((basePrice.value * (1 + taxRate.value/100)) * 100) / 100"
"Math.max(minValue.value, Math.min(maxValue.value, sliderValue.value))"
```

### Conditional Logic

```javascript
// Simple conditions
"userType.value === 'senior' ? price.value * 0.9 : price.value"
"age.value >= 18 ? 'adult' : 'minor'"

// Complex conditions
"serviceRating.value >= 4 ? 1.1 : serviceRating.value >= 3 ? 1.0 : 0.9"
```

## Expression Modes

### 1. Value Mode
Calculates and sets the field's value automatically.

```json
{
  "type": "input",
  "id": "subtotal",
  "label": "Subtotal",
  "props": {
    "type": "number",
    "readOnly": true,
    "expression": {
      "expression": "price.value * quantity.value",
      "mode": "value",
      "dependencies": ["price", "quantity"]
    }
  }
}
```

### 2. Visibility Mode
Shows/hides fields based on conditions.

```json
{
  "type": "input",
  "id": "discountCode",
  "label": "Discount Code",
  "props": {
    "expression": {
      "expression": "userType.value === 'student' || userType.value === 'senior'",
      "mode": "visibility",
      "dependencies": ["userType"]
    }
  }
}
```

### 3. HelperText Mode
Dynamic help text based on other field values.

```json
{
  "type": "slider-range",
  "id": "serviceRating",
  "label": "Service Rating",
  "props": {
    "expression": {
      "expression": "userType.value === 'senior' ? 'Senior Discount Available - Rate our service' : 'Rate our service quality'",
      "mode": "helperText",
      "dependencies": ["userType"]
    }
  }
}
```

### 4. Required Mode
Makes fields required based on conditions.

```json
{
  "type": "input",
  "id": "companyName",
  "label": "Company Name",
  "props": {
    "expression": {
      "expression": "userType.value === 'professional'",
      "mode": "required",
      "dependencies": ["userType"]
    }
  }
}
```

### 5. Disabled Mode
Enables/disables fields based on conditions.

```json
{
  "type": "input",
  "id": "studentId",
  "label": "Student ID",
  "props": {
    "expression": {
      "expression": "userType.value !== 'student'",
      "mode": "disabled",
      "dependencies": ["userType"]
    }
  }
}
```

## Slider-Specific Calculations

### Single Value Sliders

```json
{
  "type": "slider-range",
  "id": "quantity",
  "label": "Quantity",
  "props": {
    "min": 1,
    "max": 100,
    "mode": "single",
    "showValue": true
  }
},
{
  "type": "input",
  "id": "total",
  "label": "Total",
  "props": {
    "expression": {
      "expression": "price.value * quantity.value",
      "mode": "value",
      "dependencies": ["price", "quantity"]
    }
  }
}
```

### Range Sliders

```json
{
  "type": "slider-range",
  "id": "budgetRange",
  "label": "Budget Range",
  "props": {
    "min": 0,
    "max": 10000,
    "mode": "range",
    "showValue": true
  }
},
{
  "type": "input",
  "id": "budgetSize",
  "label": "Budget Range Size",
  "props": {
    "expression": {
      "expression": "budgetRange.value.max - budgetRange.value.min",
      "mode": "value",
      "dependencies": ["budgetRange"]
    }
  }
}
```

## Common Calculation Patterns

### Price Calculations

```javascript
// Basic price calculation
"basePrice.value * quantity.value"

// Price with tax
"basePrice.value * quantity.value * (1 + taxRate.value/100)"

// Price with discount
"originalPrice.value * (1 - discountPercent.value/100)"

// Complex pricing with multiple factors
"Math.round((basePrice.value * quantity.value * (1 + taxRate.value/100) * (1 - discountPercent.value/100)) * 100) / 100"
```

### Percentage Calculations

```javascript
// Simple percentage
"(part.value / whole.value) * 100"

// Tax calculation
"subtotal.value * (taxRate.value / 100)"

// Discount calculation
"originalPrice.value * (discountPercent.value / 100)"
```

### Statistical Calculations

```javascript
// Average
"(value1.value + value2.value + value3.value) / 3"

// Range
"maxValue.value - minValue.value"

// Midpoint
"(minValue.value + maxValue.value) / 2"
```

### Health Calculations

```javascript
// BMI calculation
"weight.value / Math.pow(height.value/100, 2)"

// Age calculation
"Math.floor((new Date() - new Date(birthDate.value)) / (365.25 * 24 * 60 * 60 * 1000))"
```

## Best Practices

### 1. Always Include Dependencies

```json
{
  "expression": {
    "expression": "price.value * quantity.value",
    "mode": "value",
    "dependencies": ["price", "quantity"]  // Always include this
  }
}
```

### 2. Use ReadOnly for Calculated Fields

```json
{
  "type": "input",
  "id": "total",
  "props": {
    "readOnly": true,  // Prevent manual editing
    "expression": {
      "expression": "price.value * quantity.value",
      "mode": "value"
    }
  }
}
```

### 3. Add Helpful HelperText

```json
{
  "props": {
    "helperText": "Calculated automatically: Base Price × Quantity",
    "expression": {
      "expression": "price.value * quantity.value",
      "mode": "value"
    }
  }
}
```

### 4. Handle Edge Cases

```javascript
// Provide fallback values
"fieldId.value || 0"

// Handle division by zero
"denominator.value !== 0 ? numerator.value / denominator.value : 0"

// Conditional calculations
"basePrice.value > 0 ? basePrice.value * quantity.value : 0"
```

### 5. Optimize Performance

```json
{
  "expression": {
    "expression": "complexCalculation.value",
    "mode": "value",
    "dependencies": ["field1", "field2"],
    "debounceMs": 100,  // Debounce for complex calculations
    "evaluateOnChange": true
  }
}
```

## Error Handling

Expressions automatically handle missing or invalid values:

- Missing fields return `null` or `undefined`
- Invalid operations return `NaN`
- Use conditional logic for fallback values: `fieldId.value || 0`

## Example Forms

See the following example forms for practical implementations:

- `expression-calculator-demo.json` - Comprehensive examples with sliders and calculations
- `example-expression-form.json` - Basic expression examples

## System Prompt Integration

The system prompt has been extended to include comprehensive guidance for expression-based calculations. When generating forms, the AI will now:

1. Automatically suggest calculated fields when appropriate
2. Use expressions for dynamic behavior
3. Include proper dependencies and configuration
4. Follow best practices for performance and usability

This enables the generation of sophisticated, interactive forms with real-time calculations based on user input from sliders, text fields, and other form components.
