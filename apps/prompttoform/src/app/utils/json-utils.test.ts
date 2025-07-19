import { describe, it, expect } from 'vitest';
import {
  formatJsonForDisplay,
  getRawJsonForStorage,
  parseJsonSafely,
  validateJsonFormat,
  formatJsonString,
} from './json-utils';
import { UIJson } from '../types/form-generator.types';

describe('JSON Utils', () => {
  const mockUIJson: UIJson = {
    app: {
      title: 'Test Form',
      pages: [
        {
          id: 'page1',
          title: 'Page 1',
          route: '/page1',
          components: [
            {
              id: 'input1',
              type: 'input',
              props: {
                label: 'Test Input',
                placeholder: 'Enter text',
              },
            },
          ],
        },
      ],
    },
  };

  describe('formatJsonForDisplay', () => {
    it('should format JSON with default options', () => {
      const result = formatJsonForDisplay(mockUIJson);

      expect(result).toContain('"title": "Test Form"');
      expect(result).toContain('"id": "page1"');
      expect(result).toContain('"type": "input"');
      expect(result).toMatch(/^\s*\{/); // Should start with indentation
    });

    it('should format JSON with custom indent', () => {
      const result = formatJsonForDisplay(mockUIJson, { indent: 4 });

      expect(result).toContain('"title": "Test Form"');
      expect(result).toMatch(/^\s*\{/); // Should start with indentation
    });

    it('should handle newlines in strings properly', () => {
      const jsonWithNewlines: UIJson = {
        app: {
          title: 'Test\nForm',
          pages: [],
        },
      };

      const result = formatJsonForDisplay(jsonWithNewlines);
      // Should contain the escaped newline character, not an actual newline
      expect(result).toContain('Test\\nForm');
    });

    it('should handle backslashes in strings properly', () => {
      const jsonWithBackslashes: UIJson = {
        app: {
          title: 'Test\\Form',
          pages: [],
        },
      };

      const result = formatJsonForDisplay(jsonWithBackslashes);
      // Should contain the escaped backslash, not a single backslash
      expect(result).toContain('Test\\\\Form');
    });
  });

  describe('getRawJsonForStorage', () => {
    it('should return compact JSON string', () => {
      const result = getRawJsonForStorage(mockUIJson);

      expect(result).toContain('"title":"Test Form"');
      expect(result).not.toContain('\n');
      expect(result).not.toContain('  ');
    });

    it('should be valid JSON', () => {
      const result = getRawJsonForStorage(mockUIJson);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual(mockUIJson);
    });
  });

  describe('parseJsonSafely', () => {
    it('should parse valid JSON', () => {
      const jsonString = JSON.stringify(mockUIJson);
      const result = parseJsonSafely(jsonString);

      expect(result).toEqual(mockUIJson);
    });

    it('should return null for invalid JSON', () => {
      const invalidJson = '{ "invalid": json }';
      const result = parseJsonSafely(invalidJson);

      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseJsonSafely('');
      expect(result).toBeNull();
    });

    it('should handle JSON with newlines', () => {
      const jsonWithNewlines = JSON.stringify(mockUIJson, null, 2);
      const result = parseJsonSafely(jsonWithNewlines);

      expect(result).toEqual(mockUIJson);
    });
  });

  describe('validateJsonFormat', () => {
    it('should validate correct JSON', () => {
      const validJson = JSON.stringify(mockUIJson);
      const result = validateJsonFormat(validJson);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid JSON', () => {
      const invalidJson = '{ "invalid": json }';
      const result = validateJsonFormat(invalidJson);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty string', () => {
      const result = validateJsonFormat('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('formatJsonString', () => {
    it('should format valid JSON string', () => {
      const compactJson = JSON.stringify(mockUIJson);
      const result = formatJsonString(compactJson);

      expect(result).toContain('"title": "Test Form"');
      expect(result).toMatch(/^\s*\{/);
    });

    it('should return original string for invalid JSON', () => {
      const invalidJson = '{ "invalid": json }';
      const result = formatJsonString(invalidJson);

      expect(result).toBe(invalidJson);
    });

    it('should use custom indent', () => {
      const compactJson = JSON.stringify(mockUIJson);
      const result = formatJsonString(compactJson, 4);

      expect(result).toMatch(/^\s*\{/);
    });
  });
});
