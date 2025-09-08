import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { FormRenderer } from './FormRenderer';
import { MultiLanguageFormDefinition } from '../interfaces/multi-language-interfaces';
import { PageChangeEvent } from '../interfaces/form-interfaces';

const mockForm: MultiLanguageFormDefinition = {
  app: {
    title: 'Test Form',
    pages: [
      {
        id: 'page1',
        title: 'First Page',
        route: '/page1',
        components: [
          {
            type: 'input',
            id: 'name',
            label: 'Name',
            validation: { required: true },
            props: { placeholder: 'Enter your name' },
          },
        ],
      },
      {
        id: 'page2',
        title: 'Second Page',
        route: '/page2',
        components: [
          {
            type: 'input',
            id: 'email',
            label: 'Email',
            validation: { required: true },
            props: {
              inputType: 'email',
              placeholder: 'Enter your email',
            },
          },
        ],
      },
      {
        id: 'page3',
        title: 'Final Page',
        route: '/page3',
        isEndPage: true,
        components: [
          {
            type: 'text',
            id: 'summary',
            label: 'Summary',
            props: { content: 'This is the final page' },
          },
        ],
      },
    ],
  },
  defaultLanguage: 'en',
  translations: {},
};

describe('FormRenderer Page Change Events', () => {
  it('should trigger page change event on initial render', async () => {
    const mockOnPageChange = vi.fn();

    render(
      <FormRenderer formJson={mockForm} onPageChange={mockOnPageChange} />
    );

    await waitFor(() => {
      expect(mockOnPageChange).toHaveBeenCalledWith({
        pageId: 'page1',
        pageIndex: 0,
        pageTitle: 'First Page',
        totalPages: 3,
        isFirstPage: true,
        isLastPage: false,
        isEndPage: false,
        isConfirmationPage: false,
        previousPageId: undefined,
        previousPageIndex: undefined,
      });
    });
  });

  it('should trigger page change event when navigating to next page', async () => {
    const mockOnPageChange = vi.fn();

    render(
      <FormRenderer formJson={mockForm} onPageChange={mockOnPageChange} />
    );

    // Fill required field
    const nameInput = screen.getByLabelText(/Name/);
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    // Click next button
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockOnPageChange).toHaveBeenCalledTimes(2); // Initial + navigation

      const lastCall =
        mockOnPageChange.mock.calls[mockOnPageChange.mock.calls.length - 1][0];
      expect(lastCall).toEqual({
        pageId: 'page2',
        pageIndex: 1,
        pageTitle: 'Second Page',
        totalPages: 3,
        isFirstPage: false,
        isLastPage: false,
        isEndPage: false,
        isConfirmationPage: false,
        previousPageId: 'page1',
        previousPageIndex: 0,
      });
    });
  });

  it('should trigger page change event when navigating back', async () => {
    const mockOnPageChange = vi.fn();

    render(
      <FormRenderer formJson={mockForm} onPageChange={mockOnPageChange} />
    );

    // Navigate to second page first
    const nameInput = screen.getByLabelText(/Name/);
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockOnPageChange).toHaveBeenCalledTimes(2);
    });

    // Navigate back
    const previousButton = screen.getByText('Previous');
    fireEvent.click(previousButton);

    await waitFor(() => {
      expect(mockOnPageChange).toHaveBeenCalledTimes(3);

      const lastCall =
        mockOnPageChange.mock.calls[mockOnPageChange.mock.calls.length - 1][0];
      expect(lastCall).toEqual({
        pageId: 'page1',
        pageIndex: 0,
        pageTitle: 'First Page',
        totalPages: 3,
        isFirstPage: true,
        isLastPage: false,
        isEndPage: false,
        isConfirmationPage: false,
        previousPageId: 'page2',
        previousPageIndex: 1,
      });
    });
  });

  it('should trigger page change event when form is reset', async () => {
    const mockOnPageChange = vi.fn();

    render(
      <FormRenderer formJson={mockForm} onPageChange={mockOnPageChange} />
    );

    // Navigate to second page
    const nameInput = screen.getByLabelText(/Name/);
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockOnPageChange).toHaveBeenCalledTimes(2);
    });

    // Reset form (this would typically be done through a button action)
    // For testing, we'll simulate the reset by re-rendering with a key change
    const { rerender } = render(
      <FormRenderer
        key="reset"
        formJson={mockForm}
        onPageChange={mockOnPageChange}
      />
    );

    await waitFor(() => {
      expect(mockOnPageChange).toHaveBeenCalledTimes(3);

      const lastCall =
        mockOnPageChange.mock.calls[mockOnPageChange.mock.calls.length - 1][0];
      expect(lastCall.pageIndex).toBe(0);
      expect(lastCall.pageId).toBe('page1');
    });
  });

  it('should not trigger page change event when onPageChange is not provided', async () => {
    const mockOnPageChange = vi.fn();

    render(
      <FormRenderer
        formJson={mockForm}
        // onPageChange not provided
      />
    );

    // Fill required field and navigate
    const nameInput = screen.getByLabelText(/Name/);
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      // Should not throw any errors and should navigate successfully
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    });
  });

  it('should correctly identify end page in page change event', async () => {
    const mockOnPageChange = vi.fn();

    render(
      <FormRenderer formJson={mockForm} onPageChange={mockOnPageChange} />
    );

    // Navigate to final page
    const nameInput = screen.getByLabelText(/Name/);
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      const emailInput = screen.getByLabelText(/Email/);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    });

    const nextButton2 = screen.getByText('Next');
    fireEvent.click(nextButton2);

    await waitFor(() => {
      expect(mockOnPageChange).toHaveBeenCalledTimes(3);

      const lastCall =
        mockOnPageChange.mock.calls[mockOnPageChange.mock.calls.length - 1][0];
      expect(lastCall).toEqual({
        pageId: 'page3',
        pageIndex: 2,
        pageTitle: 'Final Page',
        totalPages: 3,
        isFirstPage: false,
        isLastPage: true,
        isEndPage: true,
        isConfirmationPage: false,
        previousPageId: 'page2',
        previousPageIndex: 1,
      });
    });
  });
});
