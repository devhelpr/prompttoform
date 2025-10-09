import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/molecules/ErrorBoundary';
import { FormFlowPage } from './components/pages/form-flow-page';
import { MainAppPage } from './components/pages/main-app-page';
import { handleNetlifyRedirect } from './utils/netlify-token-handler';

// AppStateProvider removed - using Zustand store instead

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Handle Netlify authentication redirect on app load
  useEffect(() => {
    handleNetlifyRedirect();

    // Clean up any stale deployment flags on app start (but not if we just came from Netlify auth)
    const urlParams = new URLSearchParams(window.location.search);
    const hasNetlifyParams =
      urlParams.get('access_token') || urlParams.get('state');

    if (!hasNetlifyParams) {
      // Clear any stale flags if we're not coming from Netlify auth
      const triggerEditor = localStorage.getItem('netlify_trigger_editor');
      if (triggerEditor === 'true') {
        console.log('🧹 Cleaning up stale editor trigger flag');
        localStorage.removeItem('netlify_trigger_editor');
      }
    }
  }, []);

  const handleNavigateToFormFlow = (formDefinition: unknown) => {
    navigate('/form-flow', { state: { formDefinition } });
  };

  // Check if we're returning from the flow page with updated data
  const updatedFormDefinition = location.state?.updatedFormDefinition;

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
