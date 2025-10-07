import React from 'react';
import {
  getClassNames,
  getClassNamesWithColorAndStyle,
} from '../utils/class-utils';
import {
  defaultColorClasses,
  defaultStyleClasses,
} from '../config/default-classes';
import { FormComponentFieldProps } from '../interfaces/form-interfaces';

interface FormSectionFieldProps {
  fieldId: string;
  label?: string;
  children?: FormComponentFieldProps[];
  renderComponent: (
    component: FormComponentFieldProps,
    parentId?: string
  ) => React.ReactElement;
  classes?: {
    field?: string;
    fieldLabel?: string;
    noContentText?: string;
  };
  colorClasses?: {
    field?: string;
    fieldLabel?: string;
    noContentText?: string;
  };
  styleClasses?: {
    field?: string;
    fieldLabel?: string;
    noContentText?: string;
  };
}

export const FormSectionField: React.FC<FormSectionFieldProps> = ({
  fieldId,
  label,
  children,
  renderComponent,
  classes,
  colorClasses,
  styleClasses,
}) => {
  // Helper function to get merged classes
  const getMergedFieldClasses = (
    fieldKey: 'field' | 'fieldLabel' | 'noContentText'
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
  return (
    <div
      className={
        getMergedFieldClasses('field') ||
        'mb-6 p-4 border border-gray-200 rounded-md bg-gray-50'
      }
    >
      {label && (
        <h3
          className={
            getMergedFieldClasses('fieldLabel') ||
            'text-lg font-medium mb-4 text-indigo-700'
          }
        >
          {label}
        </h3>
      )}
      <div className="space-y-3">
        {Array.isArray(children) && children.length > 0 ? (
          children.map((child, index) => (
            <div key={index}>{renderComponent(child, fieldId)}</div>
          ))
        ) : (
          <div
            className={
              getMergedFieldClasses('noContentText') || 'text-sm text-gray-500'
            }
          >
            {classes?.noContentText || 'No content in this section'}
          </div>
        )}
      </div>
    </div>
  );
};
