import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormSessionService } from './indexeddb';
import {
  parseJsonSafely,
  formatJsonForDisplay,
  getRawJsonForStorage,
} from '../utils/json-utils';
import { SessionManagementService } from './session-management.service';
import { FormSession } from './indexeddb';
import { UIJson } from '../types/form-generator.types';

// Mock the IndexedDB service
vi.mock('./indexeddb', () => ({
  FormSessionService: {
    getAllSessions: vi.fn(),
    deleteSession: vi.fn(),
    getSessionWithUpdates: vi.fn(),
    updateSession: vi.fn(),
    storeUpdate: vi.fn(),
    getLatestUpdate: vi.fn(),
    getSessionWithLatestJson: vi.fn(),
    getUpdateCount: vi.fn(),
  },
}));

// Mock the JSON utils
vi.mock('../utils/json-utils', () => ({
  parseJsonSafely: vi.fn(),
  formatJsonForDisplay: vi.fn(),
  getRawJsonForStorage: vi.fn(),
}));

const mockFormSessionService = vi.mocked(FormSessionService);
const mockParseJsonSafely = vi.mocked(parseJsonSafely);
const mockFormatJsonForDisplay = vi.mocked(formatJsonForDisplay);
const mockGetRawJsonForStorage = vi.mocked(getRawJsonForStorage);

describe('SessionManagementService', () => {
  let service: SessionManagementService;
  let mockSession: FormSession;
  let mockUIJson: UIJson;

  beforeEach(() => {
    service = new SessionManagementService();
    vi.clearAllMocks();

    mockUIJson = {
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

    mockSession = {
      id: 'test-session-id',
      prompt: 'Create a test form',
      generatedJson: JSON.stringify(mockUIJson),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('loadSession', () => {
    it('should successfully load a session', async () => {
      mockParseJsonSafely.mockReturnValue(mockUIJson);
      mockFormatJsonForDisplay.mockReturnValue(
        JSON.stringify(mockUIJson, null, 2)
      );

      const result = await service.loadSession(mockSession);

      expect(result.success).toBe(true);
      expect(result.prompt).toBe('Create a test form');
      expect(result.parsedJson).toEqual(mockUIJson);
      expect(result.sessionId).toBe('test-session-id');
      expect(mockParseJsonSafely).toHaveBeenCalledWith(
        mockSession.generatedJson
      );
      expect(mockFormatJsonForDisplay).toHaveBeenCalledWith(mockUIJson);
    });

    it('should handle JSON parsing failure', async () => {
      mockParseJsonSafely.mockReturnValue(null);

      const result = await service.loadSession(mockSession);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to parse session JSON');
      expect(mockParseJsonSafely).toHaveBeenCalledWith(
        mockSession.generatedJson
      );
    });

    it('should handle JSON parsing exception', async () => {
      mockParseJsonSafely.mockImplementation(() => {
        throw new Error('JSON parse error');
      });

      const result = await service.loadSession(mockSession);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load session: Invalid JSON format');
    });
  });

  describe('getNewSessionData', () => {
    it('should return empty session data', () => {
      const result = service.getNewSessionData();

      expect(result.success).toBe(true);
      expect(result.prompt).toBe('');
      expect(result.parsedJson).toBeUndefined();
      expect(result.formattedJson).toBe('');
      expect(result.sessionId).toBeUndefined();
    });
  });

  describe('updateSessionWithNetlifySite', () => {
    it('should successfully update session with Netlify site ID', async () => {
      const siteUrl = 'https://test-site.netlify.app';
      mockGetRawJsonForStorage.mockReturnValue(JSON.stringify(mockUIJson));
      mockFormSessionService.updateSession.mockResolvedValue();

      const result = await service.updateSessionWithNetlifySite(
        'test-session-id',
        mockUIJson,
        siteUrl
      );

      expect(result.success).toBe(true);
      expect(mockGetRawJsonForStorage).toHaveBeenCalledWith(mockUIJson);
      expect(mockFormSessionService.updateSession).toHaveBeenCalledWith(
        'test-session-id',
        JSON.stringify(mockUIJson),
        'test-site.netlify.app'
      );
    });

    it('should handle update failure', async () => {
      const siteUrl = 'https://test-site.netlify.app';
      mockGetRawJsonForStorage.mockReturnValue(JSON.stringify(mockUIJson));
      mockFormSessionService.updateSession.mockRejectedValue(
        new Error('Update failed')
      );

      const result = await service.updateSessionWithNetlifySite(
        'test-session-id',
        mockUIJson,
        siteUrl
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Failed to update session with Netlify site ID'
      );
    });

    it('should extract site ID from URL correctly', async () => {
      const siteUrl = 'https://my-awesome-site.netlify.app';
      mockGetRawJsonForStorage.mockReturnValue(JSON.stringify(mockUIJson));
      mockFormSessionService.updateSession.mockResolvedValue();

      await service.updateSessionWithNetlifySite(
        'test-session-id',
        mockUIJson,
        siteUrl
      );

      expect(mockFormSessionService.updateSession).toHaveBeenCalledWith(
        'test-session-id',
        JSON.stringify(mockUIJson),
        'my-awesome-site.netlify.app'
      );
    });
  });

  describe('getAllSessions', () => {
    it('should return all sessions', async () => {
      const mockSessions = [mockSession];
      mockFormSessionService.getAllSessions.mockResolvedValue(mockSessions);

      const result = await service.getAllSessions();

      expect(result).toEqual(mockSessions);
      expect(mockFormSessionService.getAllSessions).toHaveBeenCalled();
    });

    it('should handle error when getting sessions', async () => {
      mockFormSessionService.getAllSessions.mockRejectedValue(
        new Error('Database error')
      );

      await expect(service.getAllSessions()).rejects.toThrow(
        'Failed to load sessions'
      );
    });
  });

  describe('deleteSession', () => {
    it('should successfully delete a session', async () => {
      mockFormSessionService.deleteSession.mockResolvedValue();

      const result = await service.deleteSession('test-session-id');

      expect(result.success).toBe(true);
      expect(mockFormSessionService.deleteSession).toHaveBeenCalledWith(
        'test-session-id'
      );
    });

    it('should handle delete failure', async () => {
      mockFormSessionService.deleteSession.mockRejectedValue(
        new Error('Delete failed')
      );

      const result = await service.deleteSession('test-session-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to delete session');
    });
  });

  describe('getSessionWithUpdates', () => {
    it('should return session with updates', async () => {
      const mockSessionWithUpdates = {
        session: mockSession,
        updates: [],
      };
      mockFormSessionService.getSessionWithUpdates.mockResolvedValue(
        mockSessionWithUpdates
      );

      const result = await service.getSessionWithUpdates('test-session-id');

      expect(result).toEqual(mockSessionWithUpdates);
      expect(mockFormSessionService.getSessionWithUpdates).toHaveBeenCalledWith(
        'test-session-id'
      );
    });

    it('should handle error when getting session with updates', async () => {
      mockFormSessionService.getSessionWithUpdates.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        service.getSessionWithUpdates('test-session-id')
      ).rejects.toThrow('Failed to get session with updates');
    });
  });

  describe('Form Update Functionality', () => {
    let mockUpdate: any;

    beforeEach(() => {
      mockUpdate = {
        id: 'update-123',
        sessionId: 'test-session-id',
        updatePrompt: 'Add a new field',
        updatedJson: JSON.stringify({
          app: {
            title: 'Updated Test Form',
            pages: [
              {
                id: 'page1',
                title: 'Page 1',
                route: '/page1',
                components: [
                  {
                    id: 'field1',
                    type: 'text',
                    label: 'New Field',
                  },
                ],
              },
            ],
          },
        }),
        createdAt: new Date(),
      };
    });

    describe('storeUpdate', () => {
      it('should successfully store an update', async () => {
        mockFormSessionService.storeUpdate.mockResolvedValue('update-123');

        const result = await FormSessionService.storeUpdate(
          'test-session-id',
          'Add a new field',
          JSON.stringify(mockUIJson)
        );

        expect(result).toBe('update-123');
        expect(mockFormSessionService.storeUpdate).toHaveBeenCalledWith(
          'test-session-id',
          'Add a new field',
          JSON.stringify(mockUIJson)
        );
      });

      it('should handle update storage failure', async () => {
        mockFormSessionService.storeUpdate.mockRejectedValue(
          new Error('Storage failed')
        );

        await expect(
          FormSessionService.storeUpdate(
            'test-session-id',
            'Add a new field',
            JSON.stringify(mockUIJson)
          )
        ).rejects.toThrow('Storage failed');
      });
    });

    describe('getLatestUpdate', () => {
      it('should return the most recent update for a session', async () => {
        mockFormSessionService.getLatestUpdate.mockResolvedValue(mockUpdate);

        const result = await FormSessionService.getLatestUpdate(
          'test-session-id'
        );

        expect(result).toEqual(mockUpdate);
        expect(mockFormSessionService.getLatestUpdate).toHaveBeenCalledWith(
          'test-session-id'
        );
      });

      it('should return undefined when no updates exist', async () => {
        mockFormSessionService.getLatestUpdate.mockResolvedValue(undefined);

        const result = await FormSessionService.getLatestUpdate(
          'test-session-id'
        );

        expect(result).toBeUndefined();
      });
    });

    describe('getSessionWithLatestJson', () => {
      it('should return session with latest update JSON when updates exist', async () => {
        const mockSessionWithLatestJson = {
          session: mockSession,
          latestJson: mockUpdate.updatedJson,
        };
        mockFormSessionService.getSessionWithLatestJson.mockResolvedValue(
          mockSessionWithLatestJson
        );

        const result = await FormSessionService.getSessionWithLatestJson(
          'test-session-id'
        );

        expect(result).toEqual(mockSessionWithLatestJson);
        expect(result?.latestJson).toBe(mockUpdate.updatedJson);
      });

      it('should return session with original JSON when no updates exist', async () => {
        const mockSessionWithOriginalJson = {
          session: mockSession,
          latestJson: mockSession.generatedJson,
        };
        mockFormSessionService.getSessionWithLatestJson.mockResolvedValue(
          mockSessionWithOriginalJson
        );

        const result = await FormSessionService.getSessionWithLatestJson(
          'test-session-id'
        );

        expect(result).toEqual(mockSessionWithOriginalJson);
        expect(result?.latestJson).toBe(mockSession.generatedJson);
      });

      it('should return undefined when session does not exist', async () => {
        mockFormSessionService.getSessionWithLatestJson.mockResolvedValue(
          undefined
        );

        const result = await FormSessionService.getSessionWithLatestJson(
          'non-existent-session'
        );

        expect(result).toBeUndefined();
      });
    });

    describe('getUpdateCount', () => {
      it('should return the correct number of updates for a session', async () => {
        mockFormSessionService.getUpdateCount.mockResolvedValue(3);

        const result = await FormSessionService.getUpdateCount(
          'test-session-id'
        );

        expect(result).toBe(3);
        expect(mockFormSessionService.getUpdateCount).toHaveBeenCalledWith(
          'test-session-id'
        );
      });

      it('should return 0 when no updates exist', async () => {
        mockFormSessionService.getUpdateCount.mockResolvedValue(0);

        const result = await FormSessionService.getUpdateCount(
          'test-session-id'
        );

        expect(result).toBe(0);
      });
    });
  });
});
