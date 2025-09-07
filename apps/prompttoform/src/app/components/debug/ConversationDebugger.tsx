import React, { useState } from 'react';
import { ConversationManager } from '../../services/agents/conversation-manager';

export function ConversationDebugger() {
  const [prompt, setPrompt] = useState('test form in languages nl, en and sv');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testConversation = async () => {
    try {
      setError(null);
      setResult(null);

      console.log('=== Starting Conversation Debug Test ===');
      console.log('Input prompt:', prompt);

      const manager = new ConversationManager();
      const conversationState = await manager.startConversation(prompt);

      console.log('=== Conversation State Result ===');
      console.log('Final conversation state:', conversationState);

      setResult({
        success: true,
        conversationState,
        messages: conversationState.messages,
        userMessages: conversationState.messages.filter(
          (m) => m.type === 'user'
        ),
      });
    } catch (err) {
      console.error('=== Conversation Debug Error ===');
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>Conversation Debugger</h3>

      <div style={{ marginBottom: '10px' }}>
        <label>
          Test Prompt:
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{ width: '100%', height: '60px', marginTop: '5px' }}
          />
        </label>
      </div>

      <button onClick={testConversation} style={{ marginBottom: '10px' }}>
        Test Conversation
      </button>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div>
          <h4>Result:</h4>
          <div
            style={{
              backgroundColor: '#f5f5f5',
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            <strong>Success:</strong> {result.success ? 'Yes' : 'No'}
          </div>

          <div
            style={{
              backgroundColor: '#f5f5f5',
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            <strong>Total Messages:</strong> {result.messages?.length || 0}
          </div>

          <div
            style={{
              backgroundColor: '#f5f5f5',
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            <strong>User Messages:</strong> {result.userMessages?.length || 0}
          </div>

          {result.userMessages && result.userMessages.length > 0 && (
            <div style={{ backgroundColor: '#f5f5f5', padding: '10px' }}>
              <strong>User Messages:</strong>
              <ul>
                {result.userMessages.map((msg: any, index: number) => (
                  <li key={index}>
                    <strong>Message {index + 1}:</strong> "{msg.content}"
                    <br />
                    <small>
                      ID: {msg.id}, Timestamp: {msg.timestamp}
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <details style={{ marginTop: '10px' }}>
            <summary>Full Conversation State</summary>
            <pre
              style={{
                backgroundColor: '#f5f5f5',
                padding: '10px',
                overflow: 'auto',
              }}
            >
              {JSON.stringify(result.conversationState, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
