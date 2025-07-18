import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormGenerator } from './FormGenerator';

// Mock all the services and dependencies
vi.mock('../../services/form-generation.service');
vi.mock('../../services/session-management.service');
vi.mock('../../services/pii-validation.service');
vi.mock('../../services/indexeddb');
vi.mock('../../services/llm');
vi.mock('../../services/llm-api');
vi.mock('../../services/prompt-eval');
vi.mock('../../utils/zip-utils');
vi.mock('../../utils/local-storage');
vi.mock('../../utils/netlify-deploy');
vi.mock('../../utils/blob-to-base64');
vi.mock('../../utils/pii-detect');
vi.mock('../../prompt-library/system-prompt');
vi.mock('@devhelpr/react-forms', () => ({
  FormRenderer: ({ formJson }: { formJson: any }) => (
    <div data-testid="form-renderer">{JSON.stringify(formJson)}</div>
  ),
}));

// Mock the Settings component
vi.mock('./Settings', () => ({
  Settings: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="settings-modal">
        <button onClick={onClose}>Close Settings</button>
      </div>
    ) : null,
}));

// Mock the SessionHistory component
vi.mock('./SessionHistory', () => ({
  SessionHistory: ({
    onLoadSession,
    onStartNewSession,
  }: {
    onLoadSession: (session: any) => void;
    onStartNewSession: () => void;
  }) => (
    <div data-testid="session-history">
      <button
        onClick={() => onLoadSession({ id: 'test-session', prompt: 'Test' })}
      >
        Load Session
      </button>
      <button onClick={onStartNewSession}>New Session</button>
    </div>
  ),
}));

// Mock the Alert component
vi.mock('./Alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert">{children}</div>
  ),
}));

// Mock the FormFlow components
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

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });

    // Mock URL.createObjectURL and URL.revokeObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:test');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('should render the form generator with initial state', () => {
      render(<FormGenerator formJson="" triggerDeploy={false} />);

      expect(screen.getByText('Create a Form')).toBeInTheDocument();
      expect(screen.getByLabelText(/Describe your form/)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Create Form' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Settings' })
      ).toBeInTheDocument();
    });

    it('should show API key hint when no API key is configured', () => {
      const { getCurrentAPIConfig } = require('../../services/llm-api');
      vi.mocked(getCurrentAPIConfig).mockReturnValue({
        name: 'test-api',
        apiKey: '',
        systemKey: '',
      });

      render(<FormGenerator formJson="" triggerDeploy={false} />);

      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByText(/No API key configured/)).toBeInTheDocument();
    });
  });

  describe('Prompt Input', () => {
    it('should update prompt when user types', async () => {
      render(<FormGenerator formJson="" triggerDeploy={false} />);

      const promptInput = screen.getByLabelText(/Describe your form/);
      await user.type(promptInput, 'Create a contact form');

      expect(promptInput).toHaveValue('Create a contact form');
    });

    it('should show PII warning when sensitive data is detected', async () => {
      const {
        PIIValidationService,
      } = require('../../services/pii-validation.service');
      vi.mocked(PIIValidationService.prototype.validatePII).mockReturnValue({
        hasPII: true,
        warningMessage:
          'Warning: Privacy sensitive data detected: BSN (123456789)',
      });

      render(<FormGenerator formJson="" triggerDeploy={false} />);

      const promptInput = screen.getByLabelText(/Describe your form/);
      await user.type(promptInput, 'My BSN is 123456789');

      expect(
        screen.getByText(/Warning: Privacy sensitive data detected/)
      ).toBeInTheDocument();
    });
  });

  describe('Form Generation', () => {
    it('should show loading state when generating form', async () => {
      const {
        FormGenerationService,
      } = require('../../services/form-generation.service');
      vi.mocked(
        FormGenerationService.prototype.generateForm
      ).mockImplementation(
        () =>
          new Promise(() => {
            // Never resolves - this is intentional for testing loading state
          })
      );

      render(<FormGenerator formJson="" triggerDeploy={false} />);

      const generateButton = screen.getByRole('button', {
        name: 'Create Form',
      });
      await user.click(generateButton);

      expect(screen.getByText('Generating...')).toBeInTheDocument();
      expect(generateButton).toBeDisabled();
    });

    it('should show error when generation fails', async () => {
      const {
        FormGenerationService,
      } = require('../../services/form-generation.service');
      vi.mocked(FormGenerationService.prototype.generateForm).mockResolvedValue(
        {
          success: false,
          error: 'Failed to generate form',
        }
      );

      render(<FormGenerator formJson="" triggerDeploy={false} />);

      const generateButton = screen.getByRole('button', {
        name: 'Create Form',
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to generate form')).toBeInTheDocument();
      });
    });

    it('should show generated form when successful', async () => {
      const mockFormJson = {
        app: {
          title: 'Test Form',
          pages: [
            {
              id: 'page1',
              title: 'Page 1',
              route: '/page1',
              components: [],
            },
          ],
        },
      };

      const {
        FormGenerationService,
      } = require('../../services/form-generation.service');
      vi.mocked(FormGenerationService.prototype.generateForm).mockResolvedValue(
        {
          success: true,
          parsedJson: mockFormJson,
          formattedJson: JSON.stringify(mockFormJson, null, 2),
          sessionId: 'session-123',
        }
      );

      render(<FormGenerator formJson="" triggerDeploy={false} />);

      const generateButton = screen.getByRole('button', {
        name: 'Create Form',
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByTestId('form-renderer')).toBeInTheDocument();
      });
    });
  });

  describe('View Modes', () => {
    it('should switch between view modes', async () => {
      const mockFormJson = {
        app: {
          title: 'Test Form',
          pages: [],
        },
      };

      const {
        FormGenerationService,
      } = require('../../services/form-generation.service');
      vi.mocked(FormGenerationService.prototype.generateForm).mockResolvedValue(
        {
          success: true,
          parsedJson: mockFormJson,
          formattedJson: JSON.stringify(mockFormJson, null, 2),
        }
      );

      render(<FormGenerator formJson="" triggerDeploy={false} />);

      // Generate a form first
      const generateButton = screen.getByRole('button', {
        name: 'Create Form',
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByTestId('form-renderer')).toBeInTheDocument();
      });

      // Switch to JSON view
      const jsonButton = screen.getByRole('button', { name: 'JSON' });
      await user.click(jsonButton);

      expect(screen.getByRole('textbox')).toBeInTheDocument();

      // Switch to Visual Flow view
      const flowButton = screen.getByRole('button', { name: 'Visual Flow' });
      await user.click(flowButton);

      expect(screen.getByTestId('form-flow-mermaid')).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    it('should show/hide session history', async () => {
      render(<FormGenerator formJson="" triggerDeploy={false} />);

      const historyButton = screen.getByRole('button', {
        name: 'Show History',
      });
      await user.click(historyButton);

      expect(screen.getByTestId('session-history')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Hide History' })
      ).toBeInTheDocument();

      const hideButton = screen.getByRole('button', { name: 'Hide History' });
      await user.click(hideButton);

      expect(screen.queryByTestId('session-history')).not.toBeInTheDocument();
    });

    it('should load session when clicked', async () => {
      render(<FormGenerator formJson="" triggerDeploy={false} />);

      // Show session history
      const historyButton = screen.getByRole('button', {
        name: 'Show History',
      });
      await user.click(historyButton);

      // Load a session
      const loadButton = screen.getByRole('button', { name: 'Load Session' });
      await user.click(loadButton);

      // Should hide history and update prompt
      expect(screen.queryByTestId('session-history')).not.toBeInTheDocument();
    });

    it('should start new session when clicked', async () => {
      render(<FormGenerator formJson="" triggerDeploy={false} />);

      // Show session history
      const historyButton = screen.getByRole('button', {
        name: 'Show History',
      });
      await user.click(historyButton);

      // Start new session
      const newSessionButton = screen.getByRole('button', {
        name: 'New Session',
      });
      await user.click(newSessionButton);

      // Should hide history and clear form
      expect(screen.queryByTestId('session-history')).not.toBeInTheDocument();
    });
  });

  describe('Form Updates', () => {
    it('should show update form section when form is generated', async () => {
      const mockFormJson = {
        app: {
          title: 'Test Form',
          pages: [],
        },
      };

      const {
        FormGenerationService,
      } = require('../../services/form-generation.service');
      vi.mocked(FormGenerationService.prototype.generateForm).mockResolvedValue(
        {
          success: true,
          parsedJson: mockFormJson,
          formattedJson: JSON.stringify(mockFormJson, null, 2),
        }
      );

      render(<FormGenerator formJson="" triggerDeploy={false} />);

      // Generate a form first
      const generateButton = screen.getByRole('button', {
        name: 'Create Form',
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Update Form')).toBeInTheDocument();
      });
    });

    it('should update form when update button is clicked', async () => {
      const mockFormJson = {
        app: {
          title: 'Test Form',
          pages: [],
        },
      };

      const {
        FormGenerationService,
      } = require('../../services/form-generation.service');
      vi.mocked(FormGenerationService.prototype.generateForm).mockResolvedValue(
        {
          success: true,
          parsedJson: mockFormJson,
          formattedJson: JSON.stringify(mockFormJson, null, 2),
        }
      );

      vi.mocked(FormGenerationService.prototype.updateForm).mockResolvedValue({
        success: true,
        updatedJson: JSON.stringify(
          {
            ...mockFormJson,
            app: { ...mockFormJson.app, title: 'Updated Form' },
          },
          null,
          2
        ),
      });

      render(<FormGenerator formJson="" triggerDeploy={false} />);

      // Generate a form first
      const generateButton = screen.getByRole('button', {
        name: 'Create Form',
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Update Form')).toBeInTheDocument();
      });

      // Enter update prompt
      const updateInput = screen.getByPlaceholderText(/Describe the changes/);
      await user.type(updateInput, 'Change the title');

      // Click update button
      const updateButton = screen.getByRole('button', { name: 'Update Form' });
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.getByText('Updating...')).toBeInTheDocument();
      });
    });
  });

  describe('Settings Modal', () => {
    it('should open and close settings modal', async () => {
      render(<FormGenerator formJson="" triggerDeploy={false} />);

      const settingsButton = screen.getByRole('button', { name: 'Settings' });
      await user.click(settingsButton);

      expect(screen.getByTestId('settings-modal')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', {
        name: 'Close Settings',
      });
      await user.click(closeButton);

      expect(screen.queryByTestId('settings-modal')).not.toBeInTheDocument();
    });
  });

  describe('Example Forms', () => {
    it('should load sample form when clicked', async () => {
      render(<FormGenerator formJson="" triggerDeploy={false} />);

      const sampleButton = screen.getByRole('button', {
        name: 'Load Sample Form',
      });
      await user.click(sampleButton);

      expect(screen.getByTestId('form-renderer')).toBeInTheDocument();
    });

    it('should load multi-step form when clicked', async () => {
      render(<FormGenerator formJson="" triggerDeploy={false} />);

      const multiStepButton = screen.getByRole('button', {
        name: 'Load Multi-Step Form',
      });
      await user.click(multiStepButton);

      expect(screen.getByTestId('form-renderer')).toBeInTheDocument();
    });
  });

  describe('Copy and Download', () => {
    it('should copy JSON to clipboard', async () => {
      const mockFormJson = {
        app: {
          title: 'Test Form',
          pages: [],
        },
      };

      const {
        FormGenerationService,
      } = require('../../services/form-generation.service');
      vi.mocked(FormGenerationService.prototype.generateForm).mockResolvedValue(
        {
          success: true,
          parsedJson: mockFormJson,
          formattedJson: JSON.stringify(mockFormJson, null, 2),
        }
      );

      render(<FormGenerator formJson="" triggerDeploy={false} />);

      // Generate a form first
      const generateButton = screen.getByRole('button', {
        name: 'Create Form',
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByTestId('form-renderer')).toBeInTheDocument();
      });

      // Switch to JSON view
      const jsonButton = screen.getByRole('button', { name: 'JSON' });
      await user.click(jsonButton);

      // Click copy button
      const copyButton = screen.getByTitle('Copy to Clipboard');
      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    it('should download JSON file', async () => {
      const mockFormJson = {
        app: {
          title: 'Test Form',
          pages: [],
        },
      };

      const {
        FormGenerationService,
      } = require('../../services/form-generation.service');
      vi.mocked(FormGenerationService.prototype.generateForm).mockResolvedValue(
        {
          success: true,
          parsedJson: mockFormJson,
          formattedJson: JSON.stringify(mockFormJson, null, 2),
        }
      );

      render(<FormGenerator formJson="" triggerDeploy={false} />);

      // Generate a form first
      const generateButton = screen.getByRole('button', {
        name: 'Create Form',
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByTestId('form-renderer')).toBeInTheDocument();
      });

      // Switch to JSON view
      const jsonButton = screen.getByRole('button', { name: 'JSON' });
      await user.click(jsonButton);

      // Click download button
      const downloadButton = screen.getByTitle('Download');
      await user.click(downloadButton);

      // Should create a download link
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should show error when prompt is empty', async () => {
      render(<FormGenerator formJson="" triggerDeploy={false} />);

      const generateButton = screen.getByRole('button', {
        name: 'Create Form',
      });
      await user.click(generateButton);

      expect(screen.getByText('Please enter a prompt')).toBeInTheDocument();
    });

    it('should show error when update prompt is empty', async () => {
      const mockFormJson = {
        app: {
          title: 'Test Form',
          pages: [],
        },
      };

      const {
        FormGenerationService,
      } = require('../../services/form-generation.service');
      vi.mocked(FormGenerationService.prototype.generateForm).mockResolvedValue(
        {
          success: true,
          parsedJson: mockFormJson,
          formattedJson: JSON.stringify(mockFormJson, null, 2),
        }
      );

      render(<FormGenerator formJson="" triggerDeploy={false} />);

      // Generate a form first
      const generateButton = screen.getByRole('button', {
        name: 'Create Form',
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Update Form')).toBeInTheDocument();
      });

      // Try to update without prompt
      const updateButton = screen.getByRole('button', { name: 'Update Form' });
      await user.click(updateButton);

      expect(
        screen.getByText(/Please enter an update prompt/)
      ).toBeInTheDocument();
    });
  });
});
