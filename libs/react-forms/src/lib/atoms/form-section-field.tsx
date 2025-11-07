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
  className?: string;
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
  className,
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
  
  // Check if className contains grid classes
  const hasGridClasses = className?.includes('grid') || false;
  
  // Extract grid-related classes from className
  const gridClassPattern = /\b(grid|grid-cols-\d+|grid-rows-\d+|gap-\S+|col-span-\S+|row-span-\S+|grid-flow-\S+|auto-cols-\S+|auto-rows-\S+|place-\S+|justify-items-\S+|justify-self-\S+|items-\S+|self-\S+|col-start-\S+|col-end-\S+|row-start-\S+|row-end-\S+)\b/g;
  const gridClasses = className
    ? (className.match(gridClassPattern) || []).join(' ')
    : '';
  // Create a new regex for filtering (without global flag to avoid state issues)
  const isGridClass = (cls: string) => /^(grid|grid-cols-\d+|grid-rows-\d+|gap|col-span|row-span|grid-flow|auto-cols|auto-rows|place-|justify-items|justify-self|items-|self-|col-start|col-end|row-start|row-end)/.test(cls);
  const nonGridClasses = className
    ? className
        .split(/\s+/)
        .filter((cls) => !isGridClass(cls))
        .join(' ')
    : '';
  
  // Check if className contains ONLY grid classes (no other classes)
  // This happens when a child section has className="col-span-1" - it should only be applied to wrapper
  const hasOnlyGridClasses = className && gridClasses && !nonGridClasses.trim();
  
  // Merge non-grid className prop with field classes for outer container
  const fieldClasses = getMergedFieldClasses('field') ||
    'mb-6 p-4 border border-gray-200 rounded-md bg-gray-50';
  // If className has only grid classes, don't apply them to outer container
  const outerClassName = hasOnlyGridClasses
    ? fieldClasses
    : (nonGridClasses
        ? getClassNames(fieldClasses, nonGridClasses)
        : fieldClasses);
  
  // Children container gets grid classes if present, otherwise default spacing
  // If this section has only grid classes (like col-span-1), they should be applied by parent's wrapper
  const childrenContainerClassName = hasGridClasses && !hasOnlyGridClasses
    ? gridClasses
    : 'space-y-3';
  
  return (
    <div className={outerClassName}>
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
      <div className={childrenContainerClassName}>
        {Array.isArray(children) && children.length > 0 ? (
          children.map((child, index) => {
            // Extract className from child props if present (e.g., col-span-1 for grid items)
            const childClassName = (child.props as any)?.className || '';
            return (
              <div key={index} className={childClassName || undefined}>
                {renderComponent(child, fieldId)}
              </div>
            );
          })
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
