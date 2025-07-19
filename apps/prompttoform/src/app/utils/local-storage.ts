// Utility functions for handling localStorage operations for generated form JSON

export const loadFormJsonFromLocalStorage = (): string => {
  return localStorage.getItem('formJson') || '';
};

export const saveFormJsonToLocalStorage = (json: string): void => {
  localStorage.setItem('formJson', json);
};

export const clearFormJsonFromLocalStorage = (): void => {
  localStorage.removeItem('formJson');
};

export const saveSessionIdToLocalStorage = (sessionId: string): void => {
  localStorage.setItem('deploySessionId', sessionId);
};

export const loadSessionIdFromLocalStorage = (): string | null => {
  return localStorage.getItem('deploySessionId');
};

export const clearSessionIdFromLocalStorage = (): void => {
  localStorage.removeItem('deploySessionId');
};
