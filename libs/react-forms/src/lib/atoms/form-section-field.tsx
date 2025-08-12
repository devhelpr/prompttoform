import React from 'react';
import { getClassNames } from '../utils/class-utils';
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
}

export const FormSectionField: React.FC<FormSectionFieldProps> = ({
  fieldId,
  label,
  children,
  renderComponent,
  classes,
}) => {
  return (
    <div
      className={getClassNames(
        'mb-6 p-4 border border-gray-200 rounded-md bg-gray-50',
        classes?.field
      )}
    >
      {label && (
        <h3
          className={getClassNames(
            'text-lg font-medium mb-4 text-indigo-700',
            classes?.fieldLabel
          )}
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
          <div className="text-sm text-gray-500">
            {classes?.noContentText || 'No content in this section'}
          </div>
        )}
      </div>
    </div>
  );
};
