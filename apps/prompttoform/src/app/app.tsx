import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './components/molecules/ErrorBoundary';
import { FormFlowPage } from './components/pages/form-flow-page';
import { MainAppPage } from './components/pages/main-app-page';

import { AppStateProvider } from './components/molecules/AppStateManager';

function AppContent() {
  const navigate = useNavigate();

  const handleNavigateToFormFlow = (formDefinition: unknown) => {
    navigate('/form-flow', { state: { formDefinition } });
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <MainAppPage onNavigateToFormFlow={handleNavigateToFormFlow} />
        }
      />
      <Route path="/form-flow" element={<FormFlowPage />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppStateProvider>
        <AppContent />
      </AppStateProvider>
    </ErrorBoundary>
  );
}

export default App;
