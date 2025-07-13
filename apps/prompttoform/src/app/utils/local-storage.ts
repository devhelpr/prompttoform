// Utility functions for handling localStorage operations for generated form JSON

const FORM_JSON_KEY = 'generatedForm';

export function saveFormJsonToLocalStorage(json: string) {
  try {
    localStorage.setItem(FORM_JSON_KEY, json);
  } catch (e) {
    // Optionally handle quota exceeded or other errors
    console.error('Failed to save form JSON to localStorage:', e);
  }
}

export function loadFormJsonFromLocalStorage(): string | null {
  try {
    return localStorage.getItem(FORM_JSON_KEY);
  } catch (e) {
    console.error('Failed to load form JSON from localStorage:', e);
    return null;
  }
}
