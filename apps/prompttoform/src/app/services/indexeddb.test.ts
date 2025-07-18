// Simple test file to verify IndexedDB functionality
// This can be run in the browser console to test the implementation

import { FormSessionService, generateGuid } from './indexeddb';

export async function testIndexedDB() {
  console.log('Testing IndexedDB functionality...');

  try {
    // Test 1: Create a session
    const testPrompt = 'Test prompt for form generation';
    const testJson = JSON.stringify({ test: 'data' });
    const sessionId = await FormSessionService.createSession(
      testPrompt,
      testJson
    );
    console.log('✅ Session created with ID:', sessionId);

    // Test 2: Retrieve the session
    const session = await FormSessionService.getSession(sessionId);
    console.log('✅ Session retrieved:', session);

    // Test 3: Store an update
    const updatePrompt = 'Update the form to add a new field';
    const updatedJson = JSON.stringify({
      test: 'updated data',
      newField: 'value',
    });
    const updateId = await FormSessionService.storeUpdate(
      sessionId,
      updatePrompt,
      updatedJson
    );
    console.log('✅ Update stored with ID:', updateId);

    // Test 4: Get all sessions
    const allSessions = await FormSessionService.getAllSessions();
    console.log('✅ All sessions:', allSessions);

    // Test 5: Get session with updates
    const sessionWithUpdates = await FormSessionService.getSessionWithUpdates(
      sessionId
    );
    console.log('✅ Session with updates:', sessionWithUpdates);

    // Test 6: Update session with Netlify site ID
    await FormSessionService.updateSession(
      sessionId,
      updatedJson,
      'test-site-123'
    );
    console.log('✅ Session updated with Netlify site ID');

    // Test 7: Get updated session
    const updatedSession = await FormSessionService.getSession(sessionId);
    console.log('✅ Updated session:', updatedSession);

    console.log('🎉 All IndexedDB tests passed!');

    // Clean up - delete the test session
    await FormSessionService.deleteSession(sessionId);
    console.log('🧹 Test session cleaned up');
  } catch (error) {
    console.error('❌ IndexedDB test failed:', error);
  }
}

// Test GUID generation
export function testGuidGeneration() {
  console.log('Testing GUID generation...');
  const guid1 = generateGuid();
  const guid2 = generateGuid();

  console.log('GUID 1:', guid1);
  console.log('GUID 2:', guid2);
  console.log('GUIDs are different:', guid1 !== guid2);
  console.log(
    'GUID format valid:',
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      guid1
    )
  );
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testIndexedDB = testIndexedDB;
  (window as any).testGuidGeneration = testGuidGeneration;
}
