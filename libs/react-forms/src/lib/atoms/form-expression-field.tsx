import React from 'react';
import { getClassNames } from '../utils/class-utils';
import { withExpression } from '../hoc/with-expression-v2';
import { ExpressionContext as ExpressionContextType } from '../interfaces/expression-interfaces';

interface FormExpressionFieldProps {
  fieldId: string;
  label?: string;
  expression: string;
  mode:
    | 'value'
    | 'visibility'
    | 'validation'
    | 'disabled'
    | 'required'
    | 'label'
    | 'helperText';
  dependencies?: string[];
  context: ExpressionContextType;
  children: React.ReactNode;
  classes?: {
    field?: string;
    fieldLabel?: string;
    fieldError?: string;
    fieldHelperText?: string;
  };
}

/**
 * Wrapper component that applies expression-based behavior to form fields
 * Now uses the new with-expression-v2 system for better dependency resolution
 */
export const FormExpressionField: React.FC<FormExpressionFieldProps> = ({
  fieldId,
  label,
  expression,
  mode,
  dependencies,
  context,
  children,
  classes,
}) => {
  // Create a wrapper component that applies the expression
  const ExpressionWrapper = withExpression(
    ({ children: wrappedChildren, ...props }: any) => {
      return <>{wrappedChildren}</>;
    }
  );

  // Apply expression-based modifications to children
  const modifiedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    // Clone the child with the expression configuration
    const childWithExpression = React.cloneElement(child, {
      ...child.props,
      fieldId,
      expression: {
        expression,
        mode,
        dependencies,
        evaluateOnChange: true,
        debounceMs: 100,
      },
    });

    return (
      <ExpressionWrapper
        fieldId={fieldId}
        expression={{
          expression,
          mode,
          dependencies,
          evaluateOnChange: true,
          debounceMs: 100,
        }}
      >
        {childWithExpression}
      </ExpressionWrapper>
    );
  });

  return (
    <div className={getClassNames('mb-4', classes?.field)}>
      {/* Modified Children */}
      {modifiedChildren}
    </div>
  );
};
