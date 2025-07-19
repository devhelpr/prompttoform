import Dexie, { Table } from 'dexie';

// Define the data models
export interface FormSession {
  id: string; // GUID for the session
  prompt: string;
  generatedJson: string;
  createdAt: Date;
  updatedAt: Date;
  netlifySiteId?: string; // Optional Netlify site ID for this session
}

export interface FormUpdate {
  id: string; // GUID for the update
  sessionId: string; // Links to the original FormSession
  updatePrompt: string;
  updatedJson: string;
  createdAt: Date;
}

// Extend Dexie to include our tables
export class FormGeneratorDatabase extends Dexie {
  sessions!: Table<FormSession>;
  updates!: Table<FormUpdate>;

  constructor() {
    super('FormGeneratorDatabase');
    this.version(1).stores({
      sessions: 'id, createdAt',
      updates: 'id, sessionId, createdAt',
    });
  }
}

// Create a singleton instance
export const db = new FormGeneratorDatabase();

// Initialize the database and handle any errors
db.open().catch((error) => {
  console.error('Failed to open IndexedDB:', error);
});

// Utility function to generate GUID
export function generateGuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Service functions for managing sessions
export class FormSessionService {
  // Create a new session with prompt and generated JSON
  static async createSession(
    prompt: string,
    generatedJson: string,
    netlifySiteId?: string
  ): Promise<string> {
    const sessionId = generateGuid();
    const now = new Date();

    const session: FormSession = {
      id: sessionId,
      prompt,
      generatedJson,
      createdAt: now,
      updatedAt: now,
      netlifySiteId,
    };

    await db.sessions.add(session);
    return sessionId;
  }

  // Get all sessions ordered by creation date (newest first)
  static async getAllSessions(): Promise<FormSession[]> {
    return await db.sessions.orderBy('createdAt').reverse().toArray();
  }

  // Get a specific session by ID
  static async getSession(sessionId: string): Promise<FormSession | undefined> {
    return await db.sessions.get(sessionId);
  }

  // Update an existing session (e.g., when regenerating or updating the form)
  static async updateSession(
    sessionId: string,
    generatedJson: string,
    netlifySiteId?: string
  ): Promise<void> {
    const now = new Date();
    await db.sessions.update(sessionId, {
      generatedJson,
      updatedAt: now,
      ...(netlifySiteId && { netlifySiteId }),
    });
  }

  // Delete a session and all its updates
  static async deleteSession(sessionId: string): Promise<void> {
    await db.transaction('rw', [db.sessions, db.updates], async () => {
      // Delete all updates for this session
      await db.updates.where('sessionId').equals(sessionId).delete();
      // Delete the session
      await db.sessions.delete(sessionId);
    });
  }

  // Store an update to a form
  static async storeUpdate(
    sessionId: string,
    updatePrompt: string,
    updatedJson: string
  ): Promise<string> {
    const updateId = generateGuid();
    const now = new Date();

    const update: FormUpdate = {
      id: updateId,
      sessionId,
      updatePrompt,
      updatedJson,
      createdAt: now,
    };

    await db.transaction('rw', [db.sessions, db.updates], async () => {
      // Add the update
      await db.updates.add(update);

      // Update the session with the latest JSON and timestamp
      await db.sessions.update(sessionId, {
        generatedJson: updatedJson,
        updatedAt: now,
      });
    });

    return updateId;
  }

  // Get all updates for a specific session
  static async getSessionUpdates(sessionId: string): Promise<FormUpdate[]> {
    return await db.updates
      .where('sessionId')
      .equals(sessionId)
      .reverse()
      .sortBy('createdAt');
  }

  // Get a specific update by ID
  static async getUpdate(updateId: string): Promise<FormUpdate | undefined> {
    return await db.updates.get(updateId);
  }

  // Delete a specific update
  static async deleteUpdate(updateId: string): Promise<void> {
    await db.updates.delete(updateId);
  }

  // Get session with all its updates
  static async getSessionWithUpdates(
    sessionId: string
  ): Promise<{ session: FormSession; updates: FormUpdate[] } | undefined> {
    const session = await this.getSession(sessionId);
    if (!session) return undefined;

    const updates = await this.getSessionUpdates(sessionId);
    return { session, updates };
  }

  // Get the most recent update for a session
  static async getLatestUpdate(
    sessionId: string
  ): Promise<FormUpdate | undefined> {
    return await db.updates
      .where('sessionId')
      .equals(sessionId)
      .reverse()
      .sortBy('createdAt')
      .then((updates) => updates[0]);
  }

  // Get session with the most recent JSON (either original or from latest update)
  static async getSessionWithLatestJson(
    sessionId: string
  ): Promise<{ session: FormSession; latestJson: string } | undefined> {
    const session = await this.getSession(sessionId);
    if (!session) return undefined;

    const latestUpdate = await this.getLatestUpdate(sessionId);
    const latestJson = latestUpdate
      ? latestUpdate.updatedJson
      : session.generatedJson;

    return { session, latestJson };
  }

  // Get the number of updates for a session
  static async getUpdateCount(sessionId: string): Promise<number> {
    return await db.updates.where('sessionId').equals(sessionId).count();
  }

  // Clear all data (useful for testing or reset)
  static async clearAllData(): Promise<void> {
    await db.transaction('rw', [db.sessions, db.updates], async () => {
      await db.sessions.clear();
      await db.updates.clear();
    });
  }
}
