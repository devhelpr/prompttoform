import React from 'react';
import { getClassNames } from '../utils/class-utils';

interface TextFormFieldProps {
  label?: string;
  props?: {
    content?: string;
    text?: string;
    helperText?: string;
  };
  classes?: {
    field?: string;
    fieldLabel?: string;
    fieldText?: string;
  };
}

export const TextFormField: React.FC<TextFormFieldProps> = ({
  label,
  props,
  classes,
}) => {
  return (
    <div className={getClassNames('mb-4', classes?.field)}>
      {label && (
        <label
          className={getClassNames(
            'block text-sm font-medium text-gray-700 mb-1',
            classes?.fieldLabel
          )}
        >
          {label}
        </label>
      )}
      {typeof props?.content === 'string' && (
        <p className={getClassNames('text-gray-700', classes?.fieldText)}>
          {props.content}
        </p>
      )}
      {typeof props?.text === 'string' && (
        <p className={getClassNames('text-gray-700', classes?.fieldText)}>
          {props.text}
        </p>
      )}
      {typeof props?.helperText === 'string' &&
        props.helperText.trim() !== '' && (
          <p className={getClassNames('text-gray-700', classes?.fieldText)}>
            {props.helperText}
          </p>
        )}
    </div>
  );
};
