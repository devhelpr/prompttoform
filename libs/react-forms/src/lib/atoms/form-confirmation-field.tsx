import React from 'react';
import {
  FormValues,
  FormComponentFieldProps,
} from '../interfaces/form-interfaces';

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
}

export const FormConfirmationField: React.FC<FormConfirmationFieldProps> = ({
  fieldId,
  label,
  formValues,
  formComponents,
  props,
}) => {
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
    if (value === null || value === undefined || value === '') {
      return 'Not provided';
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
      const currentPath = parentPath
        ? `${parentPath}.${component.id}`
        : component.id;

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
        const arrayValue = values[component.id];
        if (arrayValue !== undefined) {
          result.push({ component, value: arrayValue, path: currentPath });
        }
      } else {
        // Handle regular input fields
        const value = values[component.id];
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

  if (!showSummary) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {customTitle}
        </h3>
        {customMessage && <p className="text-gray-600 mb-4">{customMessage}</p>}
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
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
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
    <div className="mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{customTitle}</h3>
      {customMessage && <p className="text-gray-600 mb-6">{customMessage}</p>}

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
