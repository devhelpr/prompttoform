import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FormGenerationService } from './form-generation.service';
import { SessionManagementService } from './session-management.service';
import { PIIValidationService } from './pii-validation.service';
import { FormSessionService } from './indexeddb';
import { UISchema } from '../types/ui-schema';
import { UIJson } from '../types/form-generator.types';

// Mock the LLM services
vi.mock('./llm', () => ({
  generateUIFromPrompt: vi.fn(),
  updateFormWithPatch: vi.fn(),
}));

vi.mock('./llm-api', () => ({
  getCurrentAPIConfig: vi.fn(() => ({
    name: 'test-api',
    apiKey: 'test-key',
  })),
}));

// Mock IndexedDB
vi.mock('./indexeddb', () => ({
  FormSessionService: {
    createSession: vi.fn(),
    updateSession: vi.fn(),
    storeUpdate: vi.fn(),
    getAllSessions: vi.fn(),
    deleteSession: vi.fn(),
    getSessionWithUpdates: vi.fn(),
  },
}));

// Mock PII detection
vi.mock('../utils/pii-detect', () => ({
  detectPIIWithBSN: vi.fn(),
}));

describe('Service Integration Tests', () => {
  let formGenerationService: FormGenerationService;
  let sessionManagementService: SessionManagementService;
  let piiValidationService: PIIValidationService;
  let mockUISchema: UISchema;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock UI schema
    mockUISchema = {
      type: 'object',
      properties: {
        app: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            pages: { type: 'array' },
          },
        },
      },
    } as UISchema;

    // Initialize services
    formGenerationService = new FormGenerationService(mockUISchema, true);
    sessionManagementService = new SessionManagementService();
    piiValidationService = new PIIValidationService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Form Generation + Session Management Integration', () => {
    it('should generate form and store session successfully', async () => {
      const mockFormJson: UIJson = {
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

      const mockResponse = JSON.stringify(mockFormJson);
      const { generateUIFromPrompt } = await import('./llm');
      vi.mocked(generateUIFromPrompt).mockResolvedValue(mockResponse);

      const { FormSessionService } = await import('./indexeddb');
      vi.mocked(FormSessionService.createSession).mockResolvedValue(
        'session-123'
      );

      const result = await formGenerationService.generateForm(
        'Create a test form'
      );

      expect(result.success).toBe(true);
      expect(result.parsedJson).toEqual(mockFormJson);
      expect(result.sessionId).toBe('session-123');
      expect(FormSessionService.createSession).toHaveBeenCalledWith(
        'Create a test form',
        JSON.stringify(mockFormJson)
      );
    });

    it('should handle form generation failure gracefully', async () => {
      const { generateUIFromPrompt } = await import('./llm');
      vi.mocked(generateUIFromPrompt).mockRejectedValue(new Error('API Error'));

      const result = await formGenerationService.generateForm(
        'Create a test form'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('An error occurred while generating');
    });

    it('should handle session storage failure without failing generation', async () => {
      const mockFormJson: UIJson = {
        app: {
          title: 'Test Form',
          pages: [],
        },
      };

      const mockResponse = JSON.stringify(mockFormJson);
      const { generateUIFromPrompt } = await import('./llm');
      vi.mocked(generateUIFromPrompt).mockResolvedValue(mockResponse);

      const { FormSessionService } = await import('./indexeddb');
      vi.mocked(FormSessionService.createSession).mockRejectedValue(
        new Error('Storage Error')
      );

      const result = await formGenerationService.generateForm(
        'Create a test form'
      );

      expect(result.success).toBe(true);
      expect(result.parsedJson).toEqual(mockFormJson);
      expect(result.sessionId).toBeUndefined();
    });
  });

  describe('Form Update + Session Management Integration', () => {
    it('should update form and store update in session', async () => {
      const currentForm: UIJson = {
        app: {
          title: 'Original Form',
          pages: [],
        },
      };

      const updatedForm: UIJson = {
        app: {
          title: 'Updated Form',
          pages: [],
        },
      };

      const mockPatch = JSON.stringify([
        {
          op: 'replace',
          path: '/app/title',
          value: 'Updated Form',
        },
      ]);

      const { updateFormWithPatch } = await import('./llm');
      vi.mocked(updateFormWithPatch).mockResolvedValue(mockPatch);

      const { FormSessionService } = await import('./indexeddb');
      vi.mocked(FormSessionService.storeUpdate).mockResolvedValue('update-123');

      const result = await formGenerationService.updateForm(
        JSON.stringify(currentForm),
        'Update the form title',
        'session-123'
      );

      expect(result.success).toBe(true);
      expect(result.updatedJson).toBeDefined();
      expect(FormSessionService.storeUpdate).toHaveBeenCalledWith(
        'session-123',
        'Update the form title',
        expect.any(String),
        'patch'
      );
    });

    it('should handle update failure gracefully', async () => {
      const { updateFormWithPatch } = await import('./llm');
      vi.mocked(updateFormWithPatch).mockRejectedValue(
        new Error('Update Error')
      );

      const result = await formGenerationService.updateForm(
        '{"app":{"title":"Test","pages":[]}}',
        'Update form',
        'session-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Update Error');
    });
  });

  describe('PII Validation + Form Generation Integration', () => {
    it('should detect PII in prompts', async () => {
      const { detectPIIWithBSN } = await import('../utils/pii-detect');
      vi.mocked(detectPIIWithBSN).mockReturnValue([
        { type: 'BSN', match: '123456789', index: 0 },
      ]);

      const result = piiValidationService.validatePII('My BSN is 123456789');

      expect(result.hasPII).toBe(true);
      expect(result.warningMessage).toContain('BSN (123456789)');
    });

    it('should validate multiple fields for PII', async () => {
      const { detectPIIWithBSN } = await import('../utils/pii-detect');
      vi.mocked(detectPIIWithBSN)
        .mockReturnValueOnce([{ type: 'BSN', match: '123456789', index: 0 }])
        .mockReturnValueOnce([]);

      const fields = {
        prompt: 'My BSN is 123456789',
        updatePrompt: 'Just update the form',
      };

      const results = piiValidationService.validateMultipleFields(fields);

      expect(results.prompt.hasPII).toBe(true);
      expect(results.updatePrompt.hasPII).toBe(false);
    });

    it('should check if any field has PII', async () => {
      const { detectPIIWithBSN } = await import('../utils/pii-detect');
      vi.mocked(detectPIIWithBSN)
        .mockReturnValueOnce([])
        .mockReturnValueOnce([{ type: 'BSN', match: '123456789', index: 0 }]);

      const fields = {
        prompt: 'Just a normal prompt',
        updatePrompt: 'My BSN is 123456789',
      };

      const hasPII = piiValidationService.hasAnyPII(fields);

      expect(hasPII).toBe(true);
    });
  });

  describe('Session Management Integration', () => {
    it('should load session and format JSON correctly', async () => {
      const mockSession = {
        id: 'session-123',
        prompt: 'Test prompt',
        generatedJson: '{"app":{"title":"Test","pages":[]}}',
        createdAt: new Date(),
        updatedAt: new Date(),
        netlifySiteId: undefined,
      };

      const result = await sessionManagementService.loadSession(mockSession);

      expect(result.success).toBe(true);
      expect(result.prompt).toBe('Test prompt');
      expect(result.sessionId).toBe('session-123');
      expect(result.formattedJson).toContain('"title": "Test"');
    });

    it('should handle invalid JSON in session', async () => {
      const mockSession = {
        id: 'session-123',
        prompt: 'Test prompt',
        generatedJson: 'invalid json',
        createdAt: new Date(),
        updatedAt: new Date(),
        netlifySiteId: undefined,
      };

      const result = await sessionManagementService.loadSession(mockSession);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse session JSON');
    });

    it('should get new session data', () => {
      const result = sessionManagementService.getNewSessionData();

      expect(result.success).toBe(true);
      expect(result.prompt).toBe('');
      expect(result.formattedJson).toBe('');
      expect(result.sessionId).toBeUndefined();
    });

    it('should update session with Netlify site ID', async () => {
      const { FormSessionService } = await import('./indexeddb');
      vi.mocked(FormSessionService.updateSession).mockResolvedValue();

      const mockForm: UIJson = {
        app: {
          title: 'Test Form',
          pages: [],
        },
      };

      const result =
        await sessionManagementService.updateSessionWithNetlifySite(
          'session-123',
          mockForm,
          'https://test-site.netlify.app'
        );

      expect(result.success).toBe(true);
      expect(FormSessionService.updateSession).toHaveBeenCalledWith(
        'session-123',
        JSON.stringify(mockForm),
        'test-site.netlify.app'
      );
    });

    it('should get all sessions', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          prompt: 'Test 1',
          generatedJson: '{"app":{"title":"Test 1","pages":[]}}',
          createdAt: new Date(),
          updatedAt: new Date(),
          netlifySiteId: undefined,
        },
        {
          id: 'session-2',
          prompt: 'Test 2',
          generatedJson: '{"app":{"title":"Test 2","pages":[]}}',
          createdAt: new Date(),
          updatedAt: new Date(),
          netlifySiteId: undefined,
        },
      ];

      const { FormSessionService } = await import('./indexeddb');
      vi.mocked(FormSessionService.getAllSessions).mockResolvedValue(
        mockSessions
      );

      const result = await sessionManagementService.getAllSessions();

      expect(result).toEqual(mockSessions);
    });

    it('should delete session', async () => {
      const { FormSessionService } = await import('./indexeddb');
      vi.mocked(FormSessionService.deleteSession).mockResolvedValue();

      const result = await sessionManagementService.deleteSession(
        'session-123'
      );

      expect(result.success).toBe(true);
      expect(FormSessionService.deleteSession).toHaveBeenCalledWith(
        'session-123'
      );
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API key missing error', async () => {
      const { getCurrentAPIConfig } = await import('./llm-api');
      vi.mocked(getCurrentAPIConfig).mockReturnValue({
        name: 'test-api',
        apiKey: '',
        systemKey: '',
        baseUrl: 'https://api.test.com',
        model: 'test-model',
        description: 'Test API',
        isChatCompletionCompatible: true,
      });

      const result = await formGenerationService.generateForm('Create a form');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No API key set');
    });

    it('should handle empty prompt error', async () => {
      const result = await formGenerationService.generateForm('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Please enter a prompt');
    });

    it('should handle JSON parsing error', async () => {
      const { generateUIFromPrompt } = await import('./llm');
      vi.mocked(generateUIFromPrompt).mockResolvedValue('invalid json');

      const result = await formGenerationService.generateForm('Create a form');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse the generated JSON');
    });

    it('should handle update with empty prompt', async () => {
      const result = await formGenerationService.updateForm(
        '{"app":{"title":"Test","pages":[]}}',
        '',
        'session-123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Please enter an update prompt');
    });
  });
});
