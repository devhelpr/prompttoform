import React from "react";
import { FormComponentFieldProps } from "../../interfaces/form-interfaces";

interface FormSectionFieldProps {
  fieldId: string;
  label?: string;
  children?: FormComponentFieldProps[];
  renderComponent: (
    component: FormComponentFieldProps,
    parentId?: string
  ) => React.ReactElement;
}

export const FormSectionField: React.FC<FormSectionFieldProps> = ({
  fieldId,
  label,
  children,
  renderComponent,
}) => {
  return (
    <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
      {label && (
        <h3 className="text-lg font-medium mb-4 text-indigo-700">{label}</h3>
      )}
      <div className="space-y-3">
        {Array.isArray(children) && children.length > 0 ? (
          children.map((child, index) => (
            <div key={index}>{renderComponent(child, fieldId)}</div>
          ))
        ) : (
          <div className="text-sm text-gray-500">
            No content in this section
          </div>
        )}
      </div>
    </div>
  );
};
