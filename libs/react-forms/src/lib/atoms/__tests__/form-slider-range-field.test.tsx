import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FormSliderRangeField } from '../form-slider-range-field';
import { ExpressionContextProvider } from '../../contexts/expression-context';

describe('FormSliderRangeField', () => {
  const defaultProps = {
    fieldId: 'test-slider',
    label: 'Test Range',
    value: { min: 20, max: 80 },
    onChange: vi.fn(),
    onBlur: vi.fn(),
    showError: false,
    validationErrors: [],
    props: {
      min: 0,
      max: 100,
      step: 1,
      showLabels: true,
      showValue: true,
      helperText: 'Select a range',
    },
  };

  const renderWithContext = (component: React.ReactElement) => {
    return render(
      <ExpressionContextProvider
        formValues={{}}
        validation={{}}
        required={{}}
        errors={{}}
      >
        {component}
      </ExpressionContextProvider>
    );
  };

  it('renders with correct label and value display', () => {
    renderWithContext(<FormSliderRangeField {...defaultProps} />);

    expect(screen.getByText('Test Range')).toBeInTheDocument();
    expect(screen.getByText('Min: 20')).toBeInTheDocument();
    expect(screen.getByText('Max: 80')).toBeInTheDocument();
    expect(screen.getByText('Select a range')).toBeInTheDocument();
  });

  it('renders with min/max labels when showLabels is true', () => {
    renderWithContext(<FormSliderRangeField {...defaultProps} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('does not render value display when showValue is false', () => {
    const props = {
      ...defaultProps,
      props: { ...defaultProps.props, showValue: false },
    };

    renderWithContext(<FormSliderRangeField {...props} />);

    expect(screen.queryByText('Min: 20')).not.toBeInTheDocument();
    expect(screen.queryByText('Max: 80')).not.toBeInTheDocument();
  });

  it('does not render min/max labels when showLabels is false', () => {
    const props = {
      ...defaultProps,
      props: { ...defaultProps.props, showLabels: false },
    };

    renderWithContext(<FormSliderRangeField {...props} />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(screen.queryByText('100')).not.toBeInTheDocument();
  });

  it('shows required indicator when validation.required is true', () => {
    const props = {
      ...defaultProps,
      validation: { required: true },
    };

    renderWithContext(<FormSliderRangeField {...props} />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows error messages when showError is true', () => {
    const props = {
      ...defaultProps,
      showError: true,
      validationErrors: ['Range is too small', 'Range is invalid'],
    };

    renderWithContext(<FormSliderRangeField {...props} />);

    expect(screen.getByText('Range is too small')).toBeInTheDocument();
    expect(screen.getByText('Range is invalid')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    const props = {
      ...defaultProps,
      disabled: true,
    };

    renderWithContext(<FormSliderRangeField {...props} />);

    const sliderContainer = screen.getByLabelText('Test Range');
    expect(sliderContainer).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('handles keyboard navigation for min handle', () => {
    const onChange = vi.fn();
    const props = {
      ...defaultProps,
      onChange,
    };

    renderWithContext(<FormSliderRangeField {...props} />);

    const minHandle = screen.getByLabelText('Minimum value');
    minHandle.focus();

    // Test arrow key navigation
    fireEvent.keyDown(minHandle, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith({ min: 21, max: 80 });

    // Reset for next test
    onChange.mockClear();
    fireEvent.keyDown(minHandle, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith({ min: 19, max: 80 });
  });

  it('handles keyboard navigation for max handle', () => {
    const onChange = vi.fn();
    const props = {
      ...defaultProps,
      onChange,
    };

    renderWithContext(<FormSliderRangeField {...props} />);

    const maxHandle = screen.getByLabelText('Maximum value');
    maxHandle.focus();

    // Test arrow key navigation
    fireEvent.keyDown(maxHandle, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith({ min: 20, max: 81 });

    // Reset for next test
    onChange.mockClear();
    fireEvent.keyDown(maxHandle, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith({ min: 20, max: 79 });
  });

  it('respects step size for keyboard navigation', () => {
    const onChange = vi.fn();
    const props = {
      ...defaultProps,
      onChange,
      props: { ...defaultProps.props, step: 5 },
    };

    renderWithContext(<FormSliderRangeField {...props} />);

    const minHandle = screen.getByLabelText('Minimum value');
    minHandle.focus();

    fireEvent.keyDown(minHandle, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith({ min: 25, max: 80 });
  });

  it('handles Home and End keys', () => {
    const onChange = vi.fn();
    const props = {
      ...defaultProps,
      onChange,
    };

    renderWithContext(<FormSliderRangeField {...props} />);

    const minHandle = screen.getByLabelText('Minimum value');
    minHandle.focus();

    fireEvent.keyDown(minHandle, { key: 'Home' });
    expect(onChange).toHaveBeenCalledWith({ min: 0, max: 80 });

    // Reset for next test
    onChange.mockClear();
    fireEvent.keyDown(minHandle, { key: 'End' });
    expect(onChange).toHaveBeenCalledWith({ min: 80, max: 80 });
  });

  it('handles Page Up and Page Down keys', () => {
    const onChange = vi.fn();
    const props = {
      ...defaultProps,
      onChange,
    };

    renderWithContext(<FormSliderRangeField {...props} />);

    const minHandle = screen.getByLabelText('Minimum value');
    minHandle.focus();

    fireEvent.keyDown(minHandle, { key: 'PageUp' });
    expect(onChange).toHaveBeenCalledWith({ min: 30, max: 80 });

    // Reset for next test
    onChange.mockClear();
    fireEvent.keyDown(minHandle, { key: 'PageDown' });
    expect(onChange).toHaveBeenCalledWith({ min: 10, max: 80 });
  });
});
