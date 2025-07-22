import { FormSession } from './indexeddb';
import { UIJson } from '../types/form-generator.types';
import { FormSessionService } from './indexeddb';
import {
  parseJsonSafely,
  formatJsonForDisplay,
  getRawJsonForStorage,
} from '../utils/json-utils';

export interface SessionLoadResult {
  success: boolean;
  prompt?: string;
  parsedJson?: UIJson;
  formattedJson?: string;
  sessionId?: string;
  error?: string;
}

export interface SessionUpdateResult {
  success: boolean;
  error?: string;
}

export class SessionManagementService {
  /**
   * Load a session and return formatted data
   */
  async loadSession(session: FormSession): Promise<SessionLoadResult> {
    try {
      console.log('Loading session:', session.id);
      console.log('Stored JSON length:', session.generatedJson.length);

      // Parse the stored JSON - it should be valid JSON string
      const parsedJson = parseJsonSafely(session.generatedJson);
      if (!parsedJson) {
        return {
          success: false,
          error: 'Failed to parse session JSON',
        };
      }

      console.log('Successfully parsed JSON:', parsedJson);

      // Format the JSON for display (with proper newlines)
      const formattedJson = formatJsonForDisplay(parsedJson);

      console.log('Session loaded successfully');

      return {
        success: true,
        prompt: session.prompt,
        parsedJson,
        formattedJson,
        sessionId: session.id,
      };
    } catch (error) {
      console.error('Error loading session:', error);
      console.error('Problematic JSON:', session.generatedJson);
      return {
        success: false,
        error: 'Failed to load session: Invalid JSON format',
      };
    }
  }

  /**
   * Start a new session (clear all data)
   */
  getNewSessionData(): SessionLoadResult {
    return {
      success: true,
      prompt: '',
      parsedJson: undefined,
      formattedJson: '',
      sessionId: undefined,
    };
  }

  /**
   * Update session with Netlify site ID
   */
  async updateSessionWithNetlifySite(
    sessionId: string,
    parsedJson: UIJson,
    siteUrl: string
  ): Promise<SessionUpdateResult> {
    try {
      const siteId = siteUrl.split('/').pop() || siteUrl; // Extract site ID from URL
      const rawJson = getRawJsonForStorage(parsedJson);

      await FormSessionService.updateSession(sessionId, rawJson, siteId);
      console.log('Netlify site ID stored for session:', sessionId);

      return { success: true };
    } catch (error) {
      console.error('Failed to store Netlify site ID:', error);
      return {
        success: false,
        error: 'Failed to update session with Netlify site ID',
      };
    }
  }

  /**
   * Get all sessions
   */
  async getAllSessions(): Promise<FormSession[]> {
    try {
      return await FormSessionService.getAllSessions();
    } catch (error) {
      console.error('Failed to load sessions:', error);
      throw new Error('Failed to load sessions');
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<SessionUpdateResult> {
    try {
      await FormSessionService.deleteSession(sessionId);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete session:', error);
      return {
        success: false,
        error: 'Failed to delete session',
      };
    }
  }

  /**
   * Get session with updates
   */
  async getSessionWithUpdates(sessionId: string) {
    try {
      return await FormSessionService.getSessionWithUpdates(sessionId);
    } catch (error) {
      console.error('Failed to get session with updates:', error);
      throw new Error('Failed to get session with updates');
    }
  }
}
