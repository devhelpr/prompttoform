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
  
  // Debug: Log className received
  if (className) {
    console.log(`[FormSectionField] ${fieldId} received className:`, className);
  }
  
  // Check if className contains grid classes
  const hasGridClasses = className?.includes('grid') || false;
  
  // Extract grid-related classes from className
  // Order matters: more specific patterns first (grid-cols-* before grid) to avoid double matching
  const gridClassPattern = /\b(grid-cols-\d+|grid-rows-\d+|grid-flow-\S+|auto-cols-\S+|auto-rows-\S+|col-span-\S+|row-span-\S+|col-start-\S+|col-end-\S+|row-start-\S+|row-end-\S+|gap-\S+|place-\S+|justify-items-\S+|justify-self-\S+|items-\S+|self-\S+|grid)\b/g;
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
  
  // Check if className is ONLY a grid item class (col-span-*, row-span-*, etc.)
  // This is different from a grid container (which has "grid" or "grid-cols-*")
  // Grid items should only be applied to wrapper, not to section's own container
  const isGridItemOnly = className && /^(col-span|row-span|col-start|col-end|row-start|row-end)/.test(className.trim()) && !className.includes('grid');
  
  // Merge non-grid className prop with field classes for outer container
  const fieldClasses = getMergedFieldClasses('field') ||
    'mb-6 p-4 border border-gray-200 rounded-md bg-gray-50';
  // If className is only a grid item class, don't apply it to outer container
  const outerClassName = isGridItemOnly
    ? fieldClasses
    : (nonGridClasses
        ? getClassNames(fieldClasses, nonGridClasses)
        : fieldClasses);
  
  // Children container gets grid classes if this is a grid container (has "grid" or "grid-cols-*")
  // Grid items (col-span-*) should be applied by parent's wrapper, not here
  const isGridContainer = hasGridClasses && !isGridItemOnly;
  const childrenContainerClassName = isGridContainer
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
            if (childClassName) {
              console.log(`[FormSectionField] Child ${child.id} className:`, childClassName);
            }
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
