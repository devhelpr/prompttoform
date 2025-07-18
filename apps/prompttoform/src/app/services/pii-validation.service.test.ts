import { describe, it, expect, vi } from 'vitest';
import { detectPIIWithBSN } from '../utils/pii-detect';
import { PIIValidationService } from './pii-validation.service';

// Mock the PII detection utility
vi.mock('../utils/pii-detect', () => ({
  detectPIIWithBSN: vi.fn(),
}));

const mockDetectPIIWithBSN = vi.mocked(detectPIIWithBSN);

describe('PIIValidationService', () => {
  let service: PIIValidationService;

  beforeEach(() => {
    service = new PIIValidationService();
    vi.clearAllMocks();
  });

  describe('validatePII', () => {
    it('should return hasPII: false when no PII is detected', () => {
      mockDetectPIIWithBSN.mockReturnValue([]);

      const result = service.validatePII('This is a normal text without PII');

      expect(result.hasPII).toBe(false);
      expect(result.warningMessage).toBeUndefined();
      expect(mockDetectPIIWithBSN).toHaveBeenCalledWith(
        'This is a normal text without PII'
      );
    });

    it('should return hasPII: true with warning message when PII is detected', () => {
      const mockPIIEntities = [
        { type: 'BSN', match: '123456789', index: 0 },
        { type: 'EMAIL', match: 'test@example.com', index: 20 },
      ];
      mockDetectPIIWithBSN.mockReturnValue(mockPIIEntities);

      const result = service.validatePII(
        'My BSN is 123456789 and email is test@example.com'
      );

      expect(result.hasPII).toBe(true);
      expect(result.warningMessage).toBe(
        'Warning: Privacy sensitive data detected: BSN (123456789), EMAIL (test@example.com)'
      );
    });

    it('should handle single PII entity', () => {
      const mockPIIEntities = [{ type: 'BSN', match: '123456789', index: 0 }];
      mockDetectPIIWithBSN.mockReturnValue(mockPIIEntities);

      const result = service.validatePII('BSN: 123456789');

      expect(result.hasPII).toBe(true);
      expect(result.warningMessage).toBe(
        'Warning: Privacy sensitive data detected: BSN (123456789)'
      );
    });

    it('should handle empty string', () => {
      mockDetectPIIWithBSN.mockReturnValue([]);

      const result = service.validatePII('');

      expect(result.hasPII).toBe(false);
      expect(mockDetectPIIWithBSN).toHaveBeenCalledWith('');
    });
  });

  describe('validateMultipleFields', () => {
    it('should validate multiple fields and return results for each', () => {
      mockDetectPIIWithBSN
        .mockReturnValueOnce([]) // prompt field
        .mockReturnValueOnce([{ type: 'BSN', match: '123456789', index: 0 }]); // updatePrompt field

      const fields = {
        prompt: 'This is a normal prompt',
        updatePrompt: 'Update with BSN: 123456789',
      };

      const result = service.validateMultipleFields(fields);

      expect(result.prompt.hasPII).toBe(false);
      expect(result.updatePrompt.hasPII).toBe(true);
      expect(result.updatePrompt.warningMessage).toContain('BSN (123456789)');
      expect(mockDetectPIIWithBSN).toHaveBeenCalledTimes(2);
    });

    it('should handle empty fields object', () => {
      const result = service.validateMultipleFields({});

      expect(result).toEqual({});
      expect(mockDetectPIIWithBSN).not.toHaveBeenCalled();
    });
  });

  describe('hasAnyPII', () => {
    it('should return false when no fields have PII', () => {
      mockDetectPIIWithBSN.mockReturnValue([]);

      const fields = {
        field1: 'Normal text 1',
        field2: 'Normal text 2',
      };

      const result = service.hasAnyPII(fields);

      expect(result).toBe(false);
      expect(mockDetectPIIWithBSN).toHaveBeenCalledTimes(2);
    });

    it('should return true when at least one field has PII', () => {
      mockDetectPIIWithBSN
        .mockReturnValueOnce([]) // field1
        .mockReturnValueOnce([
          { type: 'EMAIL', match: 'test@example.com', index: 0 },
        ]); // field2

      const fields = {
        field1: 'Normal text',
        field2: 'Email: test@example.com',
      };

      const result = service.hasAnyPII(fields);

      expect(result).toBe(true);
    });

    it('should return false for empty fields object', () => {
      const result = service.hasAnyPII({});

      expect(result).toBe(false);
      expect(mockDetectPIIWithBSN).not.toHaveBeenCalled();
    });
  });

  describe('getAllPIIEntities', () => {
    it('should return all PII entities from multiple fields', () => {
      const mockEntities1 = [{ type: 'BSN', match: '123456789', index: 0 }];
      const mockEntities2 = [
        { type: 'EMAIL', match: 'test@example.com', index: 0 },
        { type: 'PHONE', match: '1234567890', index: 20 },
      ];

      mockDetectPIIWithBSN
        .mockReturnValueOnce(mockEntities1)
        .mockReturnValueOnce(mockEntities2);

      const fields = {
        field1: 'BSN: 123456789',
        field2: 'Email: test@example.com, Phone: 1234567890',
      };

      const result = service.getAllPIIEntities(fields);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ field: 'field1', entity: mockEntities1[0] });
      expect(result[1]).toEqual({ field: 'field2', entity: mockEntities2[0] });
      expect(result[2]).toEqual({ field: 'field2', entity: mockEntities2[1] });
    });

    it('should return empty array when no PII is found', () => {
      mockDetectPIIWithBSN.mockReturnValue([]);

      const fields = {
        field1: 'Normal text 1',
        field2: 'Normal text 2',
      };

      const result = service.getAllPIIEntities(fields);

      expect(result).toEqual([]);
    });

    it('should handle empty fields object', () => {
      const result = service.getAllPIIEntities({});

      expect(result).toEqual([]);
      expect(mockDetectPIIWithBSN).not.toHaveBeenCalled();
    });
  });
});
