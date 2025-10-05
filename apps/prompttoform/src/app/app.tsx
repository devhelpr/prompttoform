import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/molecules/ErrorBoundary';
import { FormFlowPage } from './components/pages/form-flow-page';
import { MainAppPage } from './components/pages/main-app-page';

// AppStateProvider removed - using Zustand store instead

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

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
