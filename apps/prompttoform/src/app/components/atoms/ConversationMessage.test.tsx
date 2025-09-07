import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ConversationMessage } from './ConversationMessage';
import type { ConversationMessage as ConversationMessageType } from '../../types/agent.types';

describe('ConversationMessage', () => {
  const mockUserMessage: ConversationMessageType = {
    id: 'msg1',
    type: 'user',
    content: 'I need a contact form',
    timestamp: new Date('2024-01-01T10:00:00Z'),
  };

  const mockAgentMessage: ConversationMessageType = {
    id: 'msg2',
    type: 'agent',
    content:
      'I can help you create a contact form. Let me ask a few questions to understand your needs better.',
    timestamp: new Date('2024-01-01T10:01:00Z'),
  };

  const mockSystemMessage: ConversationMessageType = {
    id: 'msg3',
    type: 'system',
    content: 'Conversation started',
    timestamp: new Date('2024-01-01T10:00:30Z'),
  };

  it('should render user message correctly', () => {
    render(<ConversationMessage message={mockUserMessage} />);

    expect(screen.getByText('I need a contact form')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
  });

  it('should render agent message correctly', () => {
    render(<ConversationMessage message={mockAgentMessage} />);

    expect(
      screen.getByText(
        'I can help you create a contact form. Let me ask a few questions to understand your needs better.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getByText('10:01 AM')).toBeInTheDocument();
  });

  it('should render system message correctly', () => {
    render(<ConversationMessage message={mockSystemMessage} />);

    expect(screen.getByText('Conversation started')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
  });

  it('should format timestamp correctly', () => {
    const messageWithSpecificTime: ConversationMessageType = {
      id: 'msg4',
      type: 'user',
      content: 'Test message',
      timestamp: new Date('2024-01-01T15:30:45Z'),
    };

    render(<ConversationMessage message={messageWithSpecificTime} />);

    expect(screen.getByText('3:30 PM')).toBeInTheDocument();
  });

  it('should handle long messages with proper wrapping', () => {
    const longMessage: ConversationMessageType = {
      id: 'msg5',
      type: 'agent',
      content:
        'This is a very long message that should wrap properly and not break the layout. It contains multiple sentences and should be displayed in a readable format without causing any visual issues or overflow problems.',
      timestamp: new Date('2024-01-01T10:00:00Z'),
    };

    render(<ConversationMessage message={longMessage} />);

    expect(screen.getByText(longMessage.content)).toBeInTheDocument();
  });

  it('should handle messages with special characters', () => {
    const specialCharMessage: ConversationMessageType = {
      id: 'msg6',
      type: 'user',
      content:
        'I need a form with special characters: @#$%^&*()_+-=[]{}|;:,.<>?',
      timestamp: new Date('2024-01-01T10:00:00Z'),
    };

    render(<ConversationMessage message={specialCharMessage} />);

    expect(screen.getByText(specialCharMessage.content)).toBeInTheDocument();
  });

  it('should handle messages with line breaks', () => {
    const multilineMessage: ConversationMessageType = {
      id: 'msg7',
      type: 'agent',
      content:
        'This is a message\nwith multiple lines\nand should be displayed\ncorrectly.',
      timestamp: new Date('2024-01-01T10:00:00Z'),
    };

    render(<ConversationMessage message={multilineMessage} />);

    expect(screen.getByText(multilineMessage.content)).toBeInTheDocument();
  });

  it('should handle empty content gracefully', () => {
    const emptyMessage: ConversationMessageType = {
      id: 'msg8',
      type: 'user',
      content: '',
      timestamp: new Date('2024-01-01T10:00:00Z'),
    };

    render(<ConversationMessage message={emptyMessage} />);

    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
  });

  it('should apply correct CSS classes for different message types', () => {
    const { rerender } = render(
      <ConversationMessage message={mockUserMessage} />
    );

    let messageElement = screen
      .getByText('I need a contact form')
      .closest('div');
    expect(messageElement).toHaveClass('message', 'user-message');

    rerender(<ConversationMessage message={mockAgentMessage} />);
    messageElement = screen
      .getByText(
        'I can help you create a contact form. Let me ask a few questions to understand your needs better.'
      )
      .closest('div');
    expect(messageElement).toHaveClass('message', 'agent-message');

    rerender(<ConversationMessage message={mockSystemMessage} />);
    messageElement = screen.getByText('Conversation started').closest('div');
    expect(messageElement).toHaveClass('message', 'system-message');
  });

  it('should display message ID for debugging', () => {
    render(<ConversationMessage message={mockUserMessage} />);

    // The message should have the ID as a data attribute for debugging
    const messageElement = screen
      .getByText('I need a contact form')
      .closest('div');
    expect(messageElement).toHaveAttribute('data-message-id', 'msg1');
  });

  it('should handle different time zones correctly', () => {
    // Test with a different time zone
    const messageWithTimezone: ConversationMessageType = {
      id: 'msg9',
      type: 'user',
      content: 'Test message',
      timestamp: new Date('2024-01-01T00:00:00Z'), // Midnight UTC
    };

    render(<ConversationMessage message={messageWithTimezone} />);

    // Should display the time in local timezone
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should handle very old timestamps', () => {
    const oldMessage: ConversationMessageType = {
      id: 'msg10',
      type: 'user',
      content: 'Old message',
      timestamp: new Date('2020-01-01T10:00:00Z'),
    };

    render(<ConversationMessage message={oldMessage} />);

    expect(screen.getByText('Old message')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
  });

  it('should handle future timestamps', () => {
    const futureMessage: ConversationMessageType = {
      id: 'msg11',
      type: 'user',
      content: 'Future message',
      timestamp: new Date('2030-01-01T10:00:00Z'),
    };

    render(<ConversationMessage message={futureMessage} />);

    expect(screen.getByText('Future message')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
  });
});
