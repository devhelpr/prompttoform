import React, { useState, useRef, useCallback } from 'react';
import { getClassNames } from '../utils/class-utils';

interface SliderRangeValue {
  min: number;
  max: number;
}

interface FormSliderRangeFieldProps {
  fieldId: string;
  label?: string;
  value: SliderRangeValue;
  onChange: (value: SliderRangeValue) => void;
  onBlur: () => void;
  validation?: {
    required?: boolean;
    minRange?: number;
    maxRange?: number;
    minValueMin?: number;
    minValueMax?: number;
    maxValueMin?: number;
    maxValueMax?: number;
  };
  props?: {
    min?: number;
    max?: number;
    step?: number;
    showLabels?: boolean;
    showValue?: boolean;
    helperText?: string;
    disabled?: boolean;
  };
  showError: boolean;
  validationErrors: string[];
  disabled?: boolean;
  classes?: {
    field?: string;
    fieldLabel?: string;
    fieldSlider?: string;
    fieldError?: string;
    fieldHelperText?: string;
  };
}

export const FormSliderRangeField: React.FC<FormSliderRangeFieldProps> = ({
  fieldId,
  label,
  value,
  onChange,
  onBlur,
  validation,
  props,
  showError,
  validationErrors,
  disabled,
  classes,
}) => {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const min = props?.min ?? 0;
  const max = props?.max ?? 100;
  const step = props?.step ?? 1;
  const showLabels = props?.showLabels ?? true;
  const showValue = props?.showValue ?? true;
  const isDisabled = disabled ?? props?.disabled ?? false;

  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;
  const describedBy = showError
    ? errorId
    : typeof props?.helperText === 'string' && props.helperText.trim() !== ''
    ? helperId
    : undefined;

  // Calculate percentage positions
  const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;
  const minPercentage = getPercentage(value.min);
  const maxPercentage = getPercentage(value.max);

  // Convert percentage to value
  const getValueFromPercentage = (percentage: number) => {
    const rawValue = min + (percentage / 100) * (max - min);
    return Math.round(rawValue / step) * step;
  };

  // Handle mouse/touch events
  const handlePointerDown = useCallback(
    (handle: 'min' | 'max', e: React.PointerEvent) => {
      if (isDisabled) return;

      e.preventDefault();
      setIsDragging(handle);

      const handlePointerMove = (e: PointerEvent) => {
        if (!sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const percentage = Math.max(
          0,
          Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
        );
        const newValue = getValueFromPercentage(percentage);

        if (handle === 'min') {
          const newMin = Math.min(
            newValue,
            value.max - (validation?.minRange ?? 0)
          );
          onChange({ min: newMin, max: value.max });
        } else {
          const newMax = Math.max(
            newValue,
            value.min + (validation?.minRange ?? 0)
          );
          onChange({ min: value.min, max: newMax });
        }
      };

      const handlePointerUp = () => {
        setIsDragging(null);
        onBlur();
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    },
    [disabled, value, onChange, onBlur, validation, min, max, step]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (handle: 'min' | 'max', e: React.KeyboardEvent) => {
      if (isDisabled) return;

      const stepSize = step;
      let newValue = handle === 'min' ? value.min : value.max;

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          newValue = Math.max(min, newValue - stepSize);
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          newValue = Math.min(max, newValue + stepSize);
          break;
        case 'Home':
          e.preventDefault();
          newValue = min;
          break;
        case 'End':
          e.preventDefault();
          newValue = max;
          break;
        case 'PageDown':
          e.preventDefault();
          newValue = Math.max(min, newValue - stepSize * 10);
          break;
        case 'PageUp':
          e.preventDefault();
          newValue = Math.min(max, newValue + stepSize * 10);
          break;
        default:
          return;
      }

      if (handle === 'min') {
        const newMin = Math.min(
          newValue,
          value.max - (validation?.minRange ?? 0)
        );
        onChange({ min: newMin, max: value.max });
      } else {
        const newMax = Math.max(
          newValue,
          value.min + (validation?.minRange ?? 0)
        );
        onChange({ min: value.min, max: newMax });
      }

      onBlur();
    },
    [isDisabled, value, onChange, onBlur, validation, min, max, step]
  );

  return (
    <div className={getClassNames('mb-4', classes?.field)}>
      <label
        htmlFor={fieldId}
        className={getClassNames(
          'block text-sm font-medium text-gray-700 mb-1',
          classes?.fieldLabel
        )}
      >
        {typeof label === 'string' ? label : ''}
        {!!validation?.required && (
          <span className="text-red-500 ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className="space-y-2">
        {/* Value Display */}
        {showValue && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Min: {value.min}</span>
            <span>Max: {value.max}</span>
          </div>
        )}

        {/* Slider Container */}
        <div
          ref={sliderRef}
          className={getClassNames(
            `relative h-6 bg-gray-200 rounded-lg cursor-pointer ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`,
            classes?.fieldSlider
          )}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value.min}
          aria-valuetext={`Range from ${value.min} to ${value.max}`}
          aria-label={label || 'Range slider'}
        >
          {/* Track */}
          <div className="absolute inset-0 bg-gray-200 rounded-lg" />

          {/* Active Range */}
          <div
            className="absolute h-full bg-blue-500 rounded-lg"
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`,
            }}
          />

          {/* Min Handle */}
          <div
            className={getClassNames(
              `absolute w-6 h-6 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing transform -translate-y-1/2 top-1/2 ${
                isDragging === 'min' ? 'shadow-lg scale-110' : 'hover:shadow-md'
              } ${isDisabled ? 'cursor-not-allowed' : ''}`
            )}
            style={{ left: `calc(${minPercentage}% - 12px)` }}
            onPointerDown={(e) => handlePointerDown('min', e)}
            onKeyDown={(e) => handleKeyDown('min', e)}
            tabIndex={isDisabled ? -1 : 0}
            role="slider"
            aria-valuemin={min}
            aria-valuemax={value.max}
            aria-valuenow={value.min}
            aria-label="Minimum value"
          />

          {/* Max Handle */}
          <div
            className={getClassNames(
              `absolute w-6 h-6 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing transform -translate-y-1/2 top-1/2 ${
                isDragging === 'max' ? 'shadow-lg scale-110' : 'hover:shadow-md'
              } ${isDisabled ? 'cursor-not-allowed' : ''}`
            )}
            style={{ left: `calc(${maxPercentage}% - 12px)` }}
            onPointerDown={(e) => handlePointerDown('max', e)}
            onKeyDown={(e) => handleKeyDown('max', e)}
            tabIndex={isDisabled ? -1 : 0}
            role="slider"
            aria-valuemin={value.min}
            aria-valuemax={max}
            aria-valuenow={value.max}
            aria-label="Maximum value"
          />
        </div>

        {/* Labels */}
        {showLabels && (
          <div className="flex justify-between text-xs text-gray-500">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {showError && (
        <div
          id={errorId}
          className={getClassNames(
            'mt-1 text-sm text-red-500',
            classes?.fieldError
          )}
          role="alert"
          aria-live="polite"
        >
          {validationErrors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}

      {/* Helper Text */}
      {typeof props?.helperText === 'string' &&
        props.helperText.trim() !== '' && (
          <p
            id={helperId}
            className={getClassNames(
              'mt-1 text-sm text-gray-500',
              classes?.fieldHelperText
            )}
          >
            {props.helperText}
          </p>
        )}
    </div>
  );
};
