import {
  FormRendererColorClasses,
  FormRendererStyleClasses,
  FieldClasses,
} from '../interfaces/form-interfaces';
import {
  defaultColorClasses,
  defaultStyleClasses,
} from '../config/default-classes';

/**
 * Utility function to get class names with optional overrides
 * @param baseClasses - Default Tailwind classes
 * @param overrideClasses - Optional override classes
 * @returns The override classes if provided, otherwise the base classes
 */
export const getClassNames = (
  baseClasses: string,
  overrideClasses?: string
): string => {
  return overrideClasses || baseClasses;
};

/**
 * Utility function to merge color and style classes
 * @param colorClasses - Color-related classes (backgrounds, text colors, borders)
 * @param styleClasses - Style and layout classes (spacing, sizing, positioning)
 * @param additionalClasses - Additional classes to append
 * @returns Combined class string
 */
export const mergeColorAndStyleClasses = (
  colorClasses: string,
  styleClasses: string,
  additionalClasses?: string
): string => {
  const combined = `${colorClasses} ${styleClasses}`.trim();
  if (!additionalClasses) return combined;
  return `${combined} ${additionalClasses}`;
};

/**
 * Utility function to get class names with color and style overrides
 * @param defaultColorClasses - Default color classes
 * @param defaultStyleClasses - Default style classes
 * @param colorOverride - Optional color class override
 * @param styleOverride - Optional style class override
 * @param additionalClasses - Additional classes to append
 * @returns Combined class string
 */
export const getClassNamesWithColorAndStyle = (
  defaultColorClasses: string,
  defaultStyleClasses: string,
  colorOverride?: string,
  styleOverride?: string,
  additionalClasses?: string
): string => {
  const colorClasses = colorOverride || defaultColorClasses;
  const styleClasses = styleOverride || defaultStyleClasses;
  return mergeColorAndStyleClasses(
    colorClasses,
    styleClasses,
    additionalClasses
  );
};

/**
 * Utility function to merge class names
 * @param baseClasses - Default Tailwind classes
 * @param additionalClasses - Additional classes to append
 * @returns Combined class string
 */
export const mergeClassNames = (
  baseClasses: string,
  additionalClasses?: string
): string => {
  if (!additionalClasses) return baseClasses;
  return `${baseClasses} ${additionalClasses}`;
};

/**
 * Utility function to conditionally apply classes
 * @param baseClasses - Default Tailwind classes
 * @param condition - Boolean condition
 * @param conditionalClasses - Classes to apply when condition is true
 * @returns Combined class string
 */
export const conditionalClassNames = (
  baseClasses: string,
  condition: boolean,
  conditionalClasses: string
): string => {
  return condition ? `${baseClasses} ${conditionalClasses}` : baseClasses;
};

/**
 * Helper function to convert color and style classes to field classes
 * @param colorClasses - Color classes from settings
 * @param styleClasses - Style classes from settings
 * @param legacyClasses - Legacy classes for backward compatibility
 * @returns FieldClasses object
 */
export const convertToFieldClasses = (
  colorClasses?: FormRendererColorClasses,
  styleClasses?: FormRendererStyleClasses,
  legacyClasses?: any
): FieldClasses => {
  // If legacy classes are provided, use them for backward compatibility
  if (legacyClasses) {
    return {
      field: legacyClasses.field,
      fieldLabel: legacyClasses.fieldLabel,
      fieldInput: legacyClasses.fieldInput,
      fieldTextarea: legacyClasses.fieldTextarea,
      fieldSelect: legacyClasses.fieldSelect,
      fieldCheckbox: legacyClasses.fieldCheckbox,
      fieldRadio: legacyClasses.fieldRadio,
      fieldDate: legacyClasses.fieldDate,
      fieldSlider: legacyClasses.fieldSlider,
      fieldText: legacyClasses.fieldText,
      fieldError: legacyClasses.fieldError,
      fieldHelperText: legacyClasses.fieldHelperText,
    };
  }

  // Convert new class structure to field classes
  const fieldClasses: FieldClasses = {};

  if (colorClasses || styleClasses) {
    const fieldKeys: (keyof FieldClasses)[] = [
      'field',
      'fieldLabel',
      'fieldInput',
      'fieldTextarea',
      'fieldSelect',
      'fieldCheckbox',
      'fieldRadio',
      'fieldDate',
      'fieldSlider',
      'fieldText',
      'fieldError',
      'fieldHelperText',
    ];

    fieldKeys.forEach((key) => {
      // If only colorClasses is provided, use default style classes
      // If only styleClasses is provided, use default color classes
      // If both are provided, use both
      const colorClass = colorClasses?.[key] || defaultColorClasses[key] || '';
      const styleClass = styleClasses?.[key] || defaultStyleClasses[key] || '';
      fieldClasses[key] = mergeColorAndStyleClasses(colorClass, styleClass);
    });
  }

  return fieldClasses;
};

/**
 * Utility function to get text with optional override and template variable replacement
 * @param defaultText - Default text
 * @param overrideText - Optional override text
 * @param variables - Variables to replace in the text
 * @returns The override text if provided, otherwise the default text with variables replaced
 */
export const getText = (
  defaultText: string,
  overrideText?: string,
  variables?: Record<string, string | number>
): string => {
  const text = overrideText || defaultText;

  if (!variables) return text;

  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key]?.toString() || match;
  });
};
