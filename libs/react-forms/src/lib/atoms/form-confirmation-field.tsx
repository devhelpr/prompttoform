import React from 'react';
import {
  FormValues,
  FormComponentFieldProps,
} from '../interfaces/form-interfaces';
import {
  getClassNames,
  getClassNamesWithColorAndStyle,
} from '../utils/class-utils';
import {
  defaultColorClasses,
  defaultStyleClasses,
} from '../config/default-classes';

interface FormConfirmationFieldProps {
  fieldId: string;
  label?: string;
  formValues: FormValues;
  formComponents: FormComponentFieldProps[];
  props?: {
    confirmationSettings?: {
      showSummary?: boolean;
      groupBySection?: boolean;
      excludeFields?: string[];
      customTitle?: string;
      customMessage?: string;
    };
  };
  classes?: {
    field?: string;
    fieldLabel?: string;
    fieldText?: string;
    fieldError?: string;
    fieldHelperText?: string;
  };
  colorClasses?: {
    field?: string;
    fieldLabel?: string;
    fieldText?: string;
    fieldError?: string;
    fieldHelperText?: string;
  };
  styleClasses?: {
    field?: string;
    fieldLabel?: string;
    fieldText?: string;
    fieldError?: string;
    fieldHelperText?: string;
  };
}

export const FormConfirmationField: React.FC<FormConfirmationFieldProps> = ({
  fieldId,
  label,
  formValues,
  formComponents,
  props,
  classes,
  colorClasses,
  styleClasses,
}) => {
  // Helper function to get merged classes
  const getMergedFieldClasses = (
    fieldKey:
      | 'field'
      | 'fieldLabel'
      | 'fieldText'
      | 'fieldError'
      | 'fieldHelperText'
  ) => {
    if (colorClasses || styleClasses) {
      // If only colorClasses is provided, use default style classes
      // If only styleClasses is provided, use default color classes
      // If both are provided, use both
      const colorClass =
        colorClasses?.[fieldKey] || defaultColorClasses[fieldKey] || '';
      const styleClass =
        styleClasses?.[fieldKey] || defaultStyleClasses[fieldKey] || '';
      return getClassNamesWithColorAndStyle(colorClass, styleClass);
    }
    return classes?.[fieldKey] || '';
  };
  const settings = props?.confirmationSettings || {};
  const {
    showSummary = true,
    groupBySection = false,
    excludeFields = [],
    customTitle = 'Please Review Your Information',
    customMessage = 'Please review the information below before submitting.',
  } = settings;

  // Helper function to get the human-readable value for display
  const getDisplayValue = (
    component: FormComponentFieldProps,
    value: unknown
  ): string => {
    if (isEmptyValue(value)) {
      return '-';
    }

    switch (component.type) {
      case 'checkbox':
        if (typeof value === 'boolean') {
          return value ? 'Yes' : 'No';
        }
        if (Array.isArray(value)) {
          if (value.length === 0) return 'None selected';
          // For multi-checkbox, find the labels for the selected values
          if (component.options) {
            const selectedLabels = value
              .map((val) => {
                const option = component.options?.find(
                  (opt) => (typeof opt === 'string' ? opt : opt.value) === val
                );
                return typeof option === 'string'
                  ? option
                  : option?.label || val;
              })
              .join(', ');
            return selectedLabels || value.join(', ');
          }
          return value.join(', ');
        }
        return String(value);

      case 'radio':
      case 'select':
        // Find the label for the selected option
        if (component.options) {
          const selectedOption = component.options.find(
            (option) =>
              (typeof option === 'string' ? option : option.value) ===
              String(value)
          );
          if (selectedOption) {
            return typeof selectedOption === 'string'
              ? selectedOption
              : selectedOption.label || String(value);
          }
        }
        return String(value);

      case 'date':
        // Format date for better readability
        try {
          const date = new Date(String(value));
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString();
          }
        } catch {
          // Fall through to default string representation
        }
        return String(value);

      case 'array':
        if (Array.isArray(value) && value.length > 0) {
          return `${value.length} item${value.length === 1 ? '' : 's'}`;
        }
        return 'No items';

      default:
        return String(value);
    }
  };

  // Helper function to get the label for a component
  const getComponentLabel = (component: FormComponentFieldProps): string => {
    return typeof component.label === 'string' && component.label
      ? component.label
      : component.id;
  };

  // Helper function to check if a value is empty/should show as dash
  const isEmptyValue = (value: unknown): boolean => {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (typeof value === 'boolean') return false; // booleans are never "empty"
    if (typeof value === 'number') return false; // numbers are never "empty" (even 0)
    return false;
  };

  // Helper function to replace template variables in text
  const replaceTemplateVariables = (
    text: string,
    values: FormValues
  ): string => {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const varName = variable.trim();

      // Handle nested variable paths like "applicant.fullName"
      if (varName.includes('.')) {
        const keys = varName.split('.');
        let value: unknown = values;

        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = (value as Record<string, unknown>)[key];
          } else {
            value = undefined;
            break;
          }
        }

        if (!isEmptyValue(value)) {
          return String(value);
        }
      }

      // Try direct field name match
      let directValue = values[varName];
      if (!isEmptyValue(directValue)) {
        return String(directValue);
      }

      // Try common field name variations
      const variations = [
        varName.toLowerCase(),
        varName.replace(/([A-Z])/g, '_$1').toLowerCase(), // camelCase to snake_case
        varName.replace(/_/g, ''), // remove underscores
        varName.replace(/[._]/g, ''), // remove dots and underscores
      ];

      for (const variation of variations) {
        const value = values[variation];
        if (!isEmptyValue(value)) {
          return String(value);
        }
      }

      // Try to find partial matches in field names
      const matchingKey = Object.keys(values).find(
        (key) =>
          key.toLowerCase().includes(varName.toLowerCase()) ||
          varName.toLowerCase().includes(key.toLowerCase())
      );

      if (matchingKey && !isEmptyValue(values[matchingKey])) {
        return String(values[matchingKey]);
      }

      // Return a dash for missing/empty fields
      return '-';
    });
  };

  // Helper function to extract form values recursively
  const extractFormValues = (
    components: FormComponentFieldProps[],
    values: FormValues,
    parentPath = ''
  ): Array<{
    component: FormComponentFieldProps;
    value: unknown;
    path: string;
  }> => {
    const result: Array<{
      component: FormComponentFieldProps;
      value: unknown;
      path: string;
    }> = [];

    components.forEach((component) => {
      // Use fullPath if available (from getAllFormComponents), otherwise construct it
      const currentPath =
        (component as any).fullPath ||
        (parentPath ? `${parentPath}.${component.id}` : component.id);

      // Skip excluded fields
      if (
        excludeFields.includes(component.id) ||
        excludeFields.includes(currentPath)
      ) {
        return;
      }

      // Skip non-input components that don't store values
      if (['text', 'button', 'html'].includes(component.type)) {
        return;
      }

      if (component.type === 'section' && component.children) {
        // For sections, recursively process children
        const sectionValues = extractFormValues(
          component.children,
          values,
          currentPath
        );
        result.push(...sectionValues);
      } else if (component.type === 'form' && component.children) {
        // For forms, recursively process children
        const formValues = extractFormValues(
          component.children,
          values,
          currentPath
        );
        result.push(...formValues);
      } else if (component.type === 'array') {
        // Handle array fields
        const arrayValue = values[currentPath];
        if (arrayValue !== undefined) {
          result.push({ component, value: arrayValue, path: currentPath });
        }
      } else {
        // Handle regular input fields
        const value = values[currentPath];
        if (value !== undefined) {
          result.push({ component, value, path: currentPath });
        }
      }
    });

    return result;
  };

  // Group values by section if requested
  const groupValuesBySection = (
    items: Array<{
      component: FormComponentFieldProps;
      value: unknown;
      path: string;
    }>
  ) => {
    if (!groupBySection) {
      return { 'Form Data': items };
    }

    const groups: Record<
      string,
      Array<{
        component: FormComponentFieldProps;
        value: unknown;
        path: string;
      }>
    > = {};

    items.forEach((item) => {
      const pathParts = item.path.split('.');
      let groupName = 'General';

      // Find the section this field belongs to
      const sectionComponent = formComponents.find(
        (comp) => comp.type === 'section' && pathParts.includes(comp.id)
      );

      if (sectionComponent) {
        groupName = getComponentLabel(sectionComponent);
      }

      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(item);
    });

    return groups;
  };

  // Check if customMessage contains template variables (AI-generated summary)
  const hasTemplateVariables =
    customMessage && /\{\{[^}]+\}\}/.test(customMessage);

  if (!showSummary && !hasTemplateVariables) {
    return (
      <div className={getMergedFieldClasses('field') || 'mb-6'}>
        <h3
          className={
            getMergedFieldClasses('fieldLabel') ||
            'text-lg font-medium text-gray-900 mb-4'
          }
        >
          {customTitle}
        </h3>
        {customMessage && (
          <p
            className={
              getMergedFieldClasses('fieldText') || 'text-gray-600 mb-4'
            }
          >
            {customMessage}
          </p>
        )}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-blue-800">
            Ready to submit your form. Click submit to continue.
          </p>
        </div>
      </div>
    );
  }

  const formValueItems = extractFormValues(formComponents, formValues);
  const groupedValues = groupValuesBySection(formValueItems);

  if (formValueItems.length === 0) {
    return (
      <div className={getMergedFieldClasses('field') || 'mb-6'}>
        <h3
          className={
            getMergedFieldClasses('fieldLabel') ||
            'text-lg font-medium text-gray-900 mb-4'
          }
        >
          {customTitle}
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            No form data to display. Please go back and fill out the form.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={getMergedFieldClasses('field') || 'mb-6'}>
      <h3
        className={
          getMergedFieldClasses('fieldLabel') ||
          'text-lg font-medium text-gray-900 mb-4'
        }
      >
        {customTitle}
      </h3>
      {customMessage && (
        <div
          className={getMergedFieldClasses('fieldText') || 'text-gray-600 mb-6'}
        >
          {hasTemplateVariables ? (
            <div className="whitespace-pre-line">
              {replaceTemplateVariables(customMessage, formValues)}
            </div>
          ) : (
            <p>{customMessage}</p>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {Object.entries(groupedValues).map(([groupName, items], groupIndex) => (
          <div
            key={groupIndex}
            className="border-b border-gray-200 last:border-b-0"
          >
            {groupBySection && (
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h4 className="text-md font-medium text-gray-900">
                  {groupName}
                </h4>
              </div>
            )}
            <div className="px-6 py-4">
              <dl className="space-y-4">
                {items.map(({ component, value }, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="flex flex-col sm:flex-row sm:justify-between"
                  >
                    <dt className="text-sm font-medium text-gray-500 mb-1 sm:mb-0">
                      {getComponentLabel(component)}
                    </dt>
                    <dd className="text-sm text-gray-900 sm:text-right max-w-xs break-words">
                      {getDisplayValue(component, value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-blue-800 text-sm">
          Please review the information above. If everything looks correct,
          click submit to proceed. If you need to make changes, use the Previous
          button to go back.
        </p>
      </div>
    </div>
  );
};
