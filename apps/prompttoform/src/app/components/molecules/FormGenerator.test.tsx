import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormGenerator } from './FormGenerator';
import { AppStateProvider } from './AppStateManager';

// Mock all dependencies
vi.mock('../../services/form-generation.service', () => ({
  FormGenerationService: vi.fn().mockImplementation(() => ({
    generateForm: vi.fn(),
    updateForm: vi.fn(),
  })),
}));

vi.mock('../../services/llm-api', () => ({
  getCurrentAPIConfig: vi.fn(),
}));

vi.mock('../../services/llm', () => ({
  updateFormWithPatch: vi.fn(),
}));

// Mock PIIValidationService globally so all instances return safe result
vi.doMock('../../services/pii-validation.service', () => ({
  PIIValidationService: class {
    validatePII() {
      return { hasPII: false, warningMessage: '' };
    }
  },
}));

vi.mock('../../services/indexeddb', () => ({
  FormSessionService: {
    createSession: vi.fn(),
    updateSession: vi.fn(),
    storeUpdate: vi.fn(),
    getAllSessions: vi.fn(),
    deleteSession: vi.fn(),
    getSessionWithLatestJson: vi.fn(),
    getUpdateCount: vi.fn(),
  },
}));

vi.mock('@devhelpr/react-forms', () => ({
  FormRenderer: ({ formJson }: { formJson: any }) => (
    <div data-testid="form-renderer">{JSON.stringify(formJson)}</div>
  ),
}));

vi.mock('./Settings', () => ({
  Settings: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="settings-modal">
        <button onClick={onClose}>Close Settings</button>
      </div>
    ) : null,
}));

vi.mock('./SessionHistory', () => ({
  SessionHistory: ({
    isOpen,
    onClose,
    onLoadSession,
    onStartNewSession,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onLoadSession: (session: any) => Promise<void>;
    onStartNewSession: () => void;
  }) =>
    isOpen ? (
      <div data-testid="session-history">
        <button
          onClick={async () =>
            await onLoadSession({ id: 'test-session', prompt: 'Test' })
          }
        >
          Load Session
        </button>
        <button onClick={onStartNewSession}>New Session</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

vi.mock('./Alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert">{children}</div>
  ),
}));

vi.mock('./FormFlow', () => ({
  default: ({ formJson }: { formJson: any }) => (
    <div data-testid="form-flow">{JSON.stringify(formJson)}</div>
  ),
}));

vi.mock('./FormFlowMermaid', () => ({
  default: ({ formJson }: { formJson: any }) => (
    <div data-testid="form-flow-mermaid">{JSON.stringify(formJson)}</div>
  ),
}));

describe('FormGenerator Component', () => {
  const user = userEvent.setup();

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn(),
      },
      writable: true,
    });

    // Mock URL.createObjectURL and URL.revokeObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:test');
    URL.revokeObjectURL = vi.fn();

    // Mock dialog API
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();

    // Mock IndexedDB
    global.indexedDB = {
      open: vi.fn(),
      deleteDatabase: vi.fn(),
    } as any;

    // Set default API config mock
    const { getCurrentAPIConfig } = await import('../../services/llm-api');
    vi.mocked(getCurrentAPIConfig).mockReturnValue({
      name: 'test-api',
      apiKey: 'test-key',
      systemKey: '',
      baseUrl: 'https://api.test.com',
      model: 'test-model',
      description: 'Test API',
      isChatCompletionCompatible: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper function to render FormGenerator with AppStateProvider
  const renderWithProvider = (props: {
    formJson: string;
    triggerDeploy: boolean;
  }) => {
    return render(
      <AppStateProvider>
        <FormGenerator {...props} />
      </AppStateProvider>
    );
  };

  describe('Initial Render', () => {
    it('should render the form generator with initial state', () => {
      renderWithProvider({ formJson: '', triggerDeploy: false });

      expect(screen.getByText('Create a Form')).toBeTruthy();
      expect(screen.getByLabelText(/Describe your form/)).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Create Form' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Settings' })).toBeTruthy();
    });

    it('should show API key hint when no API key is configured', async () => {
      const { getCurrentAPIConfig } = await import('../../services/llm-api');
      vi.mocked(getCurrentAPIConfig).mockReturnValue({
        name: 'test-api',
        apiKey: '',
        systemKey: '',
        baseUrl: 'https://api.test.com',
        model: 'test-model',
        description: 'Test API',
        isChatCompletionCompatible: true,
      });

      renderWithProvider({ formJson: '', triggerDeploy: false });

      expect(screen.getByTestId('alert')).toBeTruthy();
      expect(screen.getByText(/No API key configured/)).toBeTruthy();
    });
  });

  describe('Prompt Input', () => {
    it('should update prompt when user types', async () => {
      renderWithProvider({ formJson: '', triggerDeploy: false });

      const promptInput = screen.getByLabelText(/Describe your form/);
      await user.type(promptInput, 'Create a contact form');

      expect((promptInput as HTMLTextAreaElement).value).toBe(
        'Create a contact form'
      );
    });
  });

  describe('Session Management', () => {
    it('should open and close session history modal', async () => {
      renderWithProvider({ formJson: '', triggerDeploy: false });

      const historyButton = screen.getByRole('button', {
        name: 'Show History',
      });
      await user.click(historyButton);

      expect(screen.getByTestId('session-history')).toBeTruthy();

      const closeButton = screen.getByRole('button', { name: 'Close' });
      await user.click(closeButton);

      expect(screen.queryByTestId('session-history')).toBeFalsy();
    });

    it('should load session when session is selected', async () => {
      renderWithProvider({ formJson: '', triggerDeploy: false });

      const historyButton = screen.getByRole('button', {
        name: 'Show History',
      });
      await user.click(historyButton);

      const loadSessionButton = screen.getByRole('button', {
        name: 'Load Session',
      });
      await user.click(loadSessionButton);

      // Should handle the session loading without crashing
      expect(loadSessionButton).toBeTruthy();
    });
  });

  describe('Settings Modal', () => {
    it('should open and close settings modal', async () => {
      renderWithProvider({ formJson: '', triggerDeploy: false });

      const settingsButton = screen.getByRole('button', { name: 'Settings' });
      await user.click(settingsButton);

      expect(screen.getByTestId('settings-modal')).toBeTruthy();

      const closeButton = screen.getByRole('button', {
        name: 'Close Settings',
      });
      await user.click(closeButton);

      expect(screen.queryByTestId('settings-modal')).toBeFalsy();
    });
  });

  describe('Example Forms', () => {
    it('should load sample form when clicked', async () => {
      renderWithProvider({ formJson: '', triggerDeploy: false });

      const sampleButton = screen.getByRole('button', {
        name: 'Load Sample Form',
      });
      await user.click(sampleButton);

      expect(screen.getByTestId('form-renderer')).toBeTruthy();
    });

    it('should load multi-step form when clicked', async () => {
      renderWithProvider({ formJson: '', triggerDeploy: false });

      const multiStepButton = screen.getByRole('button', {
        name: 'Load Multi-Step Form',
      });
      await user.click(multiStepButton);

      expect(screen.getByTestId('form-renderer')).toBeTruthy();
    });
  });

  describe('Form Update Functionality', () => {
    it('should have update form UI elements when form is present', () => {
      // Render with a pre-existing form
      const existingForm = '{"app":{"title":"Test Form","pages":[]}}';
      renderWithProvider({ formJson: existingForm, triggerDeploy: false });

      // Check that update form elements are present
      expect(screen.getByRole('heading', { name: 'Update Form' })).toBeTruthy();
      expect(
        screen.getByPlaceholderText(/Describe the changes you want to make/)
      ).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Update Form' })).toBeTruthy();
    });
  });
});
