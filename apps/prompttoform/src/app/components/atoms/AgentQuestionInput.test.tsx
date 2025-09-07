import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AgentQuestionInput } from './AgentQuestionInput';
import type { AgentQuestion } from '../../types/agent.types';

describe('AgentQuestionInput', () => {
  const mockOnSubmit = vi.fn();
  const mockOnSkip = vi.fn();

  const mockQuestion: AgentQuestion = {
    id: 'test_question',
    question: 'What is the purpose of this form?',
    category: 'form_purpose',
    inputType: 'textarea',
    required: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render textarea input for textarea type', () => {
    render(
      <AgentQuestionInput
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isLoading={false}
      />
    );

    expect(
      screen.getByText('What is the purpose of this form?')
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render text input for text type', () => {
    const textQuestion = {
      ...mockQuestion,
      inputType: 'text' as const,
    };

    render(
      <AgentQuestionInput
        question={textQuestion}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isLoading={false}
      />
    );

    expect(
      screen.getByText('What is the purpose of this form?')
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render select input for select type', () => {
    const selectQuestion = {
      ...mockQuestion,
      inputType: 'select' as const,
      options: ['Contact Form', 'Registration Form', 'Survey'],
    };

    render(
      <AgentQuestionInput
        question={selectQuestion}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isLoading={false}
      />
    );

    expect(
      screen.getByText('What is the purpose of this form?')
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Contact Form')).toBeInTheDocument();
    expect(screen.getByText('Registration Form')).toBeInTheDocument();
    expect(screen.getByText('Survey')).toBeInTheDocument();
  });

  it('should render multiselect input for multiselect type', () => {
    const multiselectQuestion = {
      ...mockQuestion,
      inputType: 'multiselect' as const,
      options: ['Validation', 'Conditional Logic', 'File Upload'],
    };

    render(
      <AgentQuestionInput
        question={multiselectQuestion}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isLoading={false}
      />
    );

    expect(
      screen.getByText('What is the purpose of this form?')
    ).toBeInTheDocument();
    expect(screen.getByText('Validation')).toBeInTheDocument();
    expect(screen.getByText('Conditional Logic')).toBeInTheDocument();
    expect(screen.getByText('File Upload')).toBeInTheDocument();
  });

  it('should handle text input submission', () => {
    render(
      <AgentQuestionInput
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isLoading={false}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Customer feedback form' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      'Customer feedback form',
      'test_question'
    );
  });

  it('should handle select input submission', () => {
    const selectQuestion = {
      ...mockQuestion,
      inputType: 'select' as const,
      options: ['Contact Form', 'Registration Form', 'Survey'],
    };

    render(
      <AgentQuestionInput
        question={selectQuestion}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isLoading={false}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Contact Form' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith('Contact Form', 'test_question');
  });

  it('should handle multiselect input submission', () => {
    const multiselectQuestion = {
      ...mockQuestion,
      inputType: 'multiselect' as const,
      options: ['Validation', 'Conditional Logic', 'File Upload'],
    };

    render(
      <AgentQuestionInput
        question={multiselectQuestion}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isLoading={false}
      />
    );

    // Select multiple options
    const validationCheckbox = screen.getByRole('checkbox', {
      name: 'Validation',
    });
    const conditionalCheckbox = screen.getByRole('checkbox', {
      name: 'Conditional Logic',
    });

    fireEvent.click(validationCheckbox);
    fireEvent.click(conditionalCheckbox);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      ['Validation', 'Conditional Logic'],
      'test_question'
    );
  });

  it('should handle skip action', () => {
    const nonRequiredQuestion = { ...mockQuestion, required: false };

    render(
      <AgentQuestionInput
        question={nonRequiredQuestion}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isLoading={false}
      />
    );

    const skipButton = screen.getByRole('button', { name: /skip/i });
    fireEvent.click(skipButton);

    expect(mockOnSkip).toHaveBeenCalledWith('test_question');
  });

  it('should show required indicator for required questions', () => {
    render(
      <AgentQuestionInput
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isLoading={false}
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should not show required indicator for optional questions', () => {
    const optionalQuestion = {
      ...mockQuestion,
      required: false,
    };

    render(
      <AgentQuestionInput
        question={optionalQuestion}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isLoading={false}
      />
    );

    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('should disable submit button when loading', () => {
    render(
      <AgentQuestionInput
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isLoading={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /processing/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show loading state', () => {
    render(
      <AgentQuestionInput
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isLoading={true}
      />
    );

    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });

  it('should validate required fields', () => {
    render(
      <AgentQuestionInput
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isLoading={false}
      />
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    // Should not call onSubmit with empty value for required field
    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
  });

  it('should allow empty submission for optional fields', () => {
    const optionalQuestion = {
      ...mockQuestion,
      required: false,
    };

    render(
      <AgentQuestionInput
        question={optionalQuestion}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isLoading={false}
      />
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith('', 'test_question');
  });

  it('should handle keyboard submission', () => {
    render(
      <AgentQuestionInput
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isLoading={false}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Test response' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    expect(mockOnSubmit).toHaveBeenCalledWith('Test response', 'test_question');
  });

  it('should show category information', () => {
    render(
      <AgentQuestionInput
        question={mockQuestion}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isLoading={false}
      />
    );

    expect(screen.getByText(/Category: form_purpose/)).toBeInTheDocument();
  });

  it('should handle long questions gracefully', () => {
    const longQuestion = {
      ...mockQuestion,
      question:
        'This is a very long question that might wrap to multiple lines and should be handled gracefully by the component without breaking the layout or causing any visual issues.',
    };

    render(
      <AgentQuestionInput
        question={longQuestion}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isLoading={false}
      />
    );

    expect(screen.getByText(longQuestion.question)).toBeInTheDocument();
  });
});
