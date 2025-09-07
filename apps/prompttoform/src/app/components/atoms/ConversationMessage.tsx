import React from 'react';
import type { ConversationMessage as ConversationMessageType } from '../../types/agent.types';

interface ConversationMessageProps {
  message: ConversationMessageType;
}

export const ConversationMessage: React.FC<ConversationMessageProps> = ({
  message,
}) => {
  const formatTime = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getMessageTypeLabel = (
    type: ConversationMessageType['type']
  ): string => {
    switch (type) {
      case 'user':
        return 'You';
      case 'agent':
        return 'Agent';
      case 'system':
        return 'System';
      default:
        return 'Unknown';
    }
  };

  const getMessageClasses = (type: ConversationMessageType['type']): string => {
    const baseClasses = 'message p-3 rounded-lg mb-2 max-w-3xl';
    const typeClasses = {
      user: 'user-message bg-blue-100 text-blue-900 ml-auto',
      agent: 'agent-message bg-gray-100 text-gray-900 mr-auto',
      system:
        'system-message bg-yellow-100 text-yellow-900 mx-auto text-center text-sm',
    };

    return `${baseClasses} ${typeClasses[type]}`;
  };

  return (
    <div
      className={getMessageClasses(message.type)}
      data-message-id={message.id}
    >
      <div className="flex items-start justify-between mb-1">
        <span className="font-medium text-sm text-gray-600">
          {getMessageTypeLabel(message.type)}
        </span>
        <span className="text-xs text-gray-500">
          {formatTime(message.timestamp)}
        </span>
      </div>
      <div className="whitespace-pre-wrap break-words">{message.content}</div>
    </div>
  );
};
