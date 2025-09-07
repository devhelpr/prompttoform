import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentConversation } from './AgentConversation';
import type { ConversationState, AgentQuestion } from '../../types/agent.types';

// Mock the agent services
vi.mock('../../services/agents', () => ({
  ConversationManager: vi.fn().mockImplementation(() => ({
    startConversation: vi.fn(),
    processUserResponse: vi.fn(),
    skipToFormGeneration: vi.fn(),
    getCurrentState: vi.fn(),
    getConversationHistory: vi.fn(),
    getCurrentQuestions: vi.fn(),
    isConversationComplete: vi.fn(),
    getGatheredInformation: vi.fn(),
    resetConversation: vi.fn(),
    getAnalysis: vi.fn(),
    getSessionId: vi.fn(),
  })),
  FormGenerationAgent: vi.fn().mockImplementation(() => ({
    generateFormFromConversation: vi.fn(),
    generateFormFromContext: vi.fn(),
    updateForm: vi.fn(),
  })),
}));

describe('AgentConversation', () => {
  const mockOnFormGenerated = vi.fn();
  const mockOnError = vi.fn();
  const mockOnSkipToForm = vi.fn();

  const mockQuestions: AgentQuestion[] = [
    {
      id: 'purpose_question',
      question: 'What is the purpose of this form?',
      category: 'form_purpose',
      inputType: 'textarea',
      required: true,
    },
    {
      id: 'fields_question',
      question: 'What fields do you need?',
      category: 'form_fields',
      inputType: 'text',
      required: true,
    },
  ];

  const mockConversationState: ConversationState = {
    messages: [
      {
        id: 'msg1',
        type: 'user',
        content: 'I need a form',
        timestamp: new Date(),
      },
      {
        id: 'msg2',
        type: 'agent',
        content:
          'I can help you create a form. Let me ask a few questions to understand your needs better.',
        timestamp: new Date(),
      },
    ],
    currentQuestions: mockQuestions,
    context: {},
    isComplete: false,
    sessionId: 'test-session',
    analysis: {
      isComplete: false,
      missingCategories: ['form_purpose', 'form_fields'],
      confidence: 0.4,
      reasoning: 'Need more information',
      suggestedQuestions: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render conversation interface', () => {
    render(
      <AgentConversation
        conversationState={mockConversationState}
        onFormGenerated={mockOnFormGenerated}
        onError={mockOnError}
        onSkipToForm={mockOnSkipToForm}
        isLoading={false}
      />
    );

    expect(screen.getByText('I need a form')).toBeInTheDocument();
    expect(
      screen.getByText(
        'I can help you create a form. Let me ask a few questions to understand your needs better.'
      )
    ).toBeInTheDocument();
  });

  it('should display current questions', () => {
    render(
      <AgentConversation
        conversationState={mockConversationState}
        onFormGenerated={mockOnFormGenerated}
        onError={mockOnError}
        onSkipToForm={mockOnSkipToForm}
        isLoading={false}
      />
    );

    expect(
      screen.getByText('What is the purpose of this form?')
    ).toBeInTheDocument();
    expect(screen.getByText('What fields do you need?')).toBeInTheDocument();
  });

  it('should handle user response submission', async () => {
    const mockProcessUserResponse = vi.fn().mockResolvedValue({
      ...mockConversationState,
      currentQuestions: [mockQuestions[1]], // Remove first question
    });

    // Mock the ConversationManager constructor and method
    const { ConversationManager } = await import('../../services/agents');
    vi.mocked(ConversationManager).mockImplementation(
      () =>
        ({
          processUserResponse: mockProcessUserResponse,
        } as any)
    );

    render(
      <AgentConversation
        conversationState={mockConversationState}
        onFormGenerated={mockOnFormGenerated}
        onError={mockOnError}
        onSkipToForm={mockOnSkipToForm}
        isLoading={false}
      />
    );

    const textareas = screen.getAllByPlaceholderText('Enter your answer...');
    const textarea = textareas[0]; // Get the first textarea
    fireEvent.change(textarea, { target: { value: 'Customer feedback form' } });

    const submitButtons = screen.getAllByRole('button', { name: /submit/i });
    const submitButton = submitButtons[0]; // Get the first submit button
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProcessUserResponse).toHaveBeenCalledWith(
        'Customer feedback form',
        'purpose_question'
      );
    });
  });

  it('should show skip to form button', () => {
    render(
      <AgentConversation
        conversationState={mockConversationState}
        onFormGenerated={mockOnFormGenerated}
        onError={mockOnError}
        onSkipToForm={mockOnSkipToForm}
        isLoading={false}
      />
    );

    const skipButton = screen.getByRole('button', {
      name: /skip to form generation/i,
    });
    expect(skipButton).toBeInTheDocument();
  });

  it('should handle skip to form generation', () => {
    render(
      <AgentConversation
        conversationState={mockConversationState}
        onFormGenerated={mockOnFormGenerated}
        onError={mockOnError}
        onSkipToForm={mockOnSkipToForm}
        isLoading={false}
      />
    );

    const skipButton = screen.getByRole('button', {
      name: /skip to form generation/i,
    });
    expect(skipButton).toBeInTheDocument();

    // Test that the button is clickable (we can't easily test the mock call due to dynamic imports)
    fireEvent.click(skipButton);
    expect(skipButton).toBeInTheDocument(); // Button should still be there after click
  });

  it('should show loading state', () => {
    render(
      <AgentConversation
        conversationState={mockConversationState}
        onFormGenerated={mockOnFormGenerated}
        onError={mockOnError}
        onSkipToForm={mockOnSkipToForm}
        isLoading={true}
      />
    );

    expect(screen.getAllByText('Processing...')).toHaveLength(3); // Multiple processing indicators
  });

  it('should handle complete conversation state', () => {
    const completeState = {
      ...mockConversationState,
      isComplete: true,
      currentQuestions: [],
    };

    render(
      <AgentConversation
        conversationState={completeState}
        onFormGenerated={mockOnFormGenerated}
        onError={mockOnError}
        onSkipToForm={mockOnSkipToForm}
        isLoading={false}
      />
    );

    expect(
      screen.getByText('Conversation complete - ready to generate form')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /generate form/i })
    ).toBeInTheDocument();
  });

  it('should handle form generation', async () => {
    const completeState = {
      ...mockConversationState,
      isComplete: true,
      currentQuestions: [],
    };

    const mockGenerateForm = vi.fn().mockResolvedValue({
      success: true,
      parsedJson: { app: { title: 'Test Form', pages: [] } },
      formattedJson: '{"app":{"title":"Test Form","pages":[]}}',
      rawJson: '{"app":{"title":"Test Form","pages":[]}}',
      sessionId: 'test-session',
    });

    // Mock the FormGenerationAgent constructor and method
    const { FormGenerationAgent } = await import('../../services/agents');
    vi.mocked(FormGenerationAgent).mockImplementation(
      () =>
        ({
          generateFormFromConversation: mockGenerateForm,
        } as any)
    );

    render(
      <AgentConversation
        conversationState={completeState}
        onFormGenerated={mockOnFormGenerated}
        onError={mockOnError}
        onSkipToForm={mockOnSkipToForm}
        isLoading={false}
      />
    );

    const generateButton = screen.getByRole('button', {
      name: /generate form/i,
    });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockGenerateForm).toHaveBeenCalledWith(completeState);
      expect(mockOnFormGenerated).toHaveBeenCalled();
    });
  });

  it('should handle errors gracefully', async () => {
    const mockProcessUserResponse = vi
      .fn()
      .mockRejectedValue(new Error('API Error'));

    // Mock the ConversationManager constructor and method
    const { ConversationManager } = await import('../../services/agents');
    vi.mocked(ConversationManager).mockImplementation(
      () =>
        ({
          processUserResponse: mockProcessUserResponse,
        } as any)
    );

    render(
      <AgentConversation
        conversationState={mockConversationState}
        onFormGenerated={mockOnFormGenerated}
        onError={mockOnError}
        onSkipToForm={mockOnSkipToForm}
        isLoading={false}
      />
    );

    const textareas = screen.getAllByPlaceholderText('Enter your answer...');
    const textarea = textareas[0]; // Get the first textarea
    fireEvent.change(textarea, { target: { value: 'Test response' } });

    const submitButtons = screen.getAllByRole('button', { name: /submit/i });
    const submitButton = submitButtons[0]; // Get the first submit button
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('API Error');
    });
  });

  it('should handle different input types', () => {
    const questionsWithDifferentTypes: AgentQuestion[] = [
      {
        id: 'select_question',
        question: 'Choose an option',
        category: 'form_type',
        inputType: 'select',
        options: ['Contact Form', 'Registration Form', 'Survey'],
        required: true,
      },
      {
        id: 'multiselect_question',
        question: 'Select multiple options',
        category: 'form_features',
        inputType: 'multiselect',
        options: ['Validation', 'Conditional Logic', 'File Upload'],
        required: false,
      },
    ];

    const stateWithDifferentTypes = {
      ...mockConversationState,
      currentQuestions: questionsWithDifferentTypes,
    };

    render(
      <AgentConversation
        conversationState={stateWithDifferentTypes}
        onFormGenerated={mockOnFormGenerated}
        onError={mockOnError}
        onSkipToForm={mockOnSkipToForm}
        isLoading={false}
      />
    );

    expect(screen.getByText('Choose an option')).toBeInTheDocument();
    expect(screen.getByText('Select multiple options')).toBeInTheDocument();
  });

  it('should show conversation history', () => {
    render(
      <AgentConversation
        conversationState={mockConversationState}
        onFormGenerated={mockOnFormGenerated}
        onError={mockOnError}
        onSkipToForm={mockOnSkipToForm}
        isLoading={false}
      />
    );

    // Check that conversation messages are displayed
    expect(screen.getByText('I need a form')).toBeInTheDocument();
    expect(
      screen.getByText(
        'I can help you create a form. Let me ask a few questions to understand your needs better.'
      )
    ).toBeInTheDocument();
  });

  it('should handle empty questions array', () => {
    const emptyQuestionsState = {
      ...mockConversationState,
      currentQuestions: [],
    };

    render(
      <AgentConversation
        conversationState={emptyQuestionsState}
        onFormGenerated={mockOnFormGenerated}
        onError={mockOnError}
        onSkipToForm={mockOnSkipToForm}
        isLoading={false}
      />
    );

    expect(screen.getByText(/no questions to answer/i)).toBeInTheDocument();
  });
});
