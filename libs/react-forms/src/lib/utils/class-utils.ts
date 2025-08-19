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
