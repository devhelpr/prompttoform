import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/molecules/ErrorBoundary';
import { FormFlowPage } from './components/pages/form-flow-page';
import { MainAppPage } from './components/pages/main-app-page';
import { netlifyTokenHandler } from './utils/netlify-token-handler';
import {
  loadFormJsonFromLocalStorage,
  loadSessionIdFromLocalStorage,
  clearFormJsonFromLocalStorage,
  clearSessionIdFromLocalStorage,
} from './utils/local-storage';
import { FormSessionService } from './services/indexeddb';
import { parseJsonSafely } from './utils/json-utils';

// AppStateProvider removed - using Zustand store instead

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigateToFormFlow = (formDefinition: unknown) => {
    navigate('/form-flow', { state: { formDefinition } });
  };

  // Check if we're returning from the flow page with updated data
  const updatedFormDefinition = location.state?.updatedFormDefinition;

  // Check for triggerDeploy flag and handle post-authentication restoration
  React.useEffect(() => {
    // Initialize Netlify token handler to check for access_token in URL
    netlifyTokenHandler();

    // Check URL parameters for triggerDeploy flag
    const urlParams = new URLSearchParams(window.location.search);
    const triggerDeploy = urlParams.get('triggerDeploy') === 'true';

    if (triggerDeploy) {
      console.log('🔄 TriggerDeploy: Detected post-authentication redirect');

      // Get stored data from localStorage
      const formJson = loadFormJsonFromLocalStorage();
      const storedSessionId = loadSessionIdFromLocalStorage();

      console.log('📦 Stored session ID:', storedSessionId);
      console.log(
        '📄 Form JSON from localStorage:',
        formJson ? 'Present' : 'Missing'
      );

      if (formJson && storedSessionId) {
        // Restore session data and trigger deployment
        handlePostAuthenticationRestoration(storedSessionId, formJson);
      } else {
        console.log(
          '⚠️ Missing stored data for post-authentication restoration'
        );
      }
    }
  }, []);

  const handlePostAuthenticationRestoration = async (
    sessionId: string,
    formJson: string
  ) => {
    try {
      console.log('🔄 Loading session data from IndexedDB...');

      // Load session data from IndexedDB
      const sessionData = await FormSessionService.getSessionWithLatestJson(
        sessionId
      );

      if (sessionData) {
        console.log('✅ Session data loaded from IndexedDB');
        console.log('📝 Session prompt:', sessionData.session.prompt);
        console.log('📄 Session JSON length:', sessionData.latestJson.length);

        // Parse the JSON to validate it
        const parsedJson = parseJsonSafely(sessionData.latestJson);
        if (parsedJson) {
          console.log('✅ JSON parsed successfully');

          // Store the data in a way that MainAppPage can access it
          // We'll use sessionStorage for temporary storage during the redirect
          sessionStorage.setItem('restoreSessionId', sessionId);
          sessionStorage.setItem('restoreFormJson', sessionData.latestJson);
          sessionStorage.setItem('restorePrompt', sessionData.session.prompt);
          sessionStorage.setItem(
            'restoreParsedJson',
            JSON.stringify(parsedJson)
          );
          sessionStorage.setItem('triggerDeploy', 'true');

          console.log('🚀 Session data prepared for restoration');
        } else {
          console.log('⚠️ JSON parsing failed, using localStorage data');
          // Fallback to localStorage data
          const fallbackParsedJson = parseJsonSafely(formJson);
          if (fallbackParsedJson) {
            sessionStorage.setItem('restoreSessionId', sessionId);
            sessionStorage.setItem('restoreFormJson', formJson);
            sessionStorage.setItem('restorePrompt', '');
            sessionStorage.setItem(
              'restoreParsedJson',
              JSON.stringify(fallbackParsedJson)
            );
            sessionStorage.setItem('triggerDeploy', 'true');
          }
        }
      } else {
        console.log(
          '❌ Session not found in IndexedDB, using localStorage data'
        );
        // Fallback to localStorage data
        const parsedJson = parseJsonSafely(formJson);
        if (parsedJson) {
          sessionStorage.setItem('restoreSessionId', sessionId);
          sessionStorage.setItem('restoreFormJson', formJson);
          sessionStorage.setItem('restorePrompt', '');
          sessionStorage.setItem(
            'restoreParsedJson',
            JSON.stringify(parsedJson)
          );
          sessionStorage.setItem('triggerDeploy', 'true');
        }
      }
    } catch (error) {
      console.error('❌ Failed to load session data from IndexedDB:', error);
      console.log('🔄 Falling back to localStorage data...');

      // Fallback to localStorage data
      const parsedJson = parseJsonSafely(formJson);
      if (parsedJson) {
        sessionStorage.setItem('restoreSessionId', sessionId);
        sessionStorage.setItem('restoreFormJson', formJson);
        sessionStorage.setItem('restorePrompt', '');
        sessionStorage.setItem('restoreParsedJson', JSON.stringify(parsedJson));
        sessionStorage.setItem('triggerDeploy', 'true');
      }
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <MainAppPage
            onNavigateToFormFlow={handleNavigateToFormFlow}
            updatedFormDefinition={updatedFormDefinition}
          />
        }
      />
      <Route path="/form-flow" element={<FormFlowPage />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
