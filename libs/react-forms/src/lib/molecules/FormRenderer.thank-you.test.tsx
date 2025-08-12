import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { FormRenderer } from './FormRenderer';
import { FormDefinition } from '../interfaces/form-interfaces';

const mockThankYouForm: FormDefinition = {
  app: {
    title: 'Test Form with Thank You Page',
    pages: [
      {
        id: 'test-page',
        title: 'Test Page',
        route: '/test',
        layout: 'vertical',
        isEndPage: true,
        components: [
          {
            type: 'input',
            id: 'name',
            label: 'Name',
            validation: {
              required: true,
            },
          },
        ],
      },
    ],
    thankYouPage: {
      title: 'Thank You!',
      message: 'Your form has been submitted successfully.',
      showRestartButton: true,
    },
  },
};

describe('FormRenderer Thank You Page', () => {
  it('should show thank you page after successful form submission', async () => {
    const mockOnSubmit = vi.fn();

    render(
      <FormRenderer formJson={mockThankYouForm} onSubmit={mockOnSubmit} />
    );

    // Fill in required field
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    // Submit form
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Wait for thank you page to appear
    await waitFor(() => {
      expect(screen.getByText('Thank You!')).toBeDefined();
    });

    expect(
      screen.getByText('Your form has been submitted successfully.')
    ).toBeDefined();
    expect(screen.getByText('Submit Another Response')).toBeDefined();
  });

  it('should restart form when restart button is clicked', async () => {
    const mockOnSubmit = vi.fn();

    render(
      <FormRenderer formJson={mockThankYouForm} onSubmit={mockOnSubmit} />
    );

    // Fill and submit form
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Wait for thank you page
    await waitFor(() => {
      expect(screen.getByText('Thank You!')).toBeDefined();
    });

    // Click restart button
    const restartButton = screen.getByText('Submit Another Response');
    fireEvent.click(restartButton);

    // Should be back to form
    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeDefined();
    });

    // Form should be reset
    const resetNameInput = screen.getByLabelText('Name') as HTMLInputElement;
    expect(resetNameInput.value).toBe('');
  });

  it('should not show thank you page if not configured', async () => {
    const formWithoutThankYou: FormDefinition = {
      app: {
        title: 'Test Form',
        pages: [
          {
            id: 'test-page',
            title: 'Test Page',
            route: '/test',
            layout: 'vertical',
            isEndPage: true,
            components: [
              {
                type: 'input',
                id: 'name',
                label: 'Name',
                validation: {
                  required: true,
                },
              },
            ],
          },
        ],
      },
    };

    const mockOnSubmit = vi.fn();

    render(
      <FormRenderer formJson={formWithoutThankYou} onSubmit={mockOnSubmit} />
    );

    // Fill and submit form
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Should not show thank you page, form should be reset
    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeDefined();
    });

    const finalNameInput = screen.getByLabelText('Name') as HTMLInputElement;
    expect(finalNameInput.value).toBe('');
  });
});
