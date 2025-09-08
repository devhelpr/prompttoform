import React, { useState } from 'react';
import { ConversationManager } from '../../services/agents/conversation-manager';
import { FormGenerationAgent } from '../../services/agents/form-generation-agent';
import schemaJson from '@schema';

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

      // Test form generation
      console.log('=== Testing Form Generation ===');
      const formGenerationAgent = new FormGenerationAgent(
        schemaJson as any,
        true
      );
      const formResult = await formGenerationAgent.generateFormFromConversation(
        conversationState
      );

      console.log('=== Form Generation Result ===');
      console.log('Form generation result:', formResult);

      setResult({
        success: true,
        conversationState,
        messages: conversationState.messages,
        userMessages: conversationState.messages.filter(
          (m) => m.type === 'user'
        ),
        formResult,
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

          {result.formResult && (
            <div
              style={{
                backgroundColor: '#f5f5f5',
                padding: '10px',
                marginTop: '10px',
              }}
            >
              <strong>Form Generation Result:</strong>
              <div style={{ marginTop: '5px' }}>
                <strong>Success:</strong>{' '}
                {result.formResult.success ? 'Yes' : 'No'}
              </div>
              {result.formResult.error && (
                <div style={{ color: 'red', marginTop: '5px' }}>
                  <strong>Error:</strong> {result.formResult.error}
                </div>
              )}
              {result.formResult.parsedJson && (
                <div style={{ marginTop: '5px' }}>
                  <strong>Has Parsed JSON:</strong> Yes
                  {result.formResult.parsedJson.translations && (
                    <div style={{ color: 'green', marginTop: '5px' }}>
                      <strong>✅ Multi-language support detected!</strong>
                      <br />
                      <small>
                        Languages:{' '}
                        {Object.keys(
                          result.formResult.parsedJson.translations
                        ).join(', ')}
                      </small>
                    </div>
                  )}
                </div>
              )}
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
