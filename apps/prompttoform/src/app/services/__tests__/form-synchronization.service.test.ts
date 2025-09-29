import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormSynchronizationService } from '../form-synchronization.service';
import { FormDefinition } from '@devhelpr/react-forms';
import { Node, Edge } from '@xyflow/react';

// Mock form definition for testing
const mockFormDefinition: FormDefinition = {
  app: {
    title: 'Test Form',
    pages: [
      {
        id: 'page1',
        title: 'First Page',
        route: '/page1',
        layout: 'vertical',
        components: [
          {
            type: 'input',
            id: 'field1',
            label: 'Name',
            props: {
              placeholder: 'Enter your name',
              inputType: 'text',
            },
            validation: {
              required: true,
            },
          },
        ],
        nextPage: 'page2',
      },
      {
        id: 'page2',
        title: 'Second Page',
        route: '/page2',
        layout: 'vertical',
        components: [
          {
            type: 'input',
            id: 'field2',
            label: 'Email',
            props: {
              placeholder: 'Enter your email',
              inputType: 'email',
            },
            validation: {
              required: true,
            },
          },
        ],
        isEndPage: true,
      },
    ],
  },
};

// Mock nodes and edges for testing
const mockNodes: Node[] = [
  {
    id: 'page1',
    type: 'tooltip',
    position: { x: 0, y: 0 },
    data: {
      page: mockFormDefinition.app.pages[0],
    },
  },
  {
    id: 'page2',
    type: 'tooltip',
    position: { x: 200, y: 0 },
    data: {
      page: mockFormDefinition.app.pages[1],
    },
  },
];

const mockEdges: Edge[] = [
  {
    id: 'page1-to-page2',
    source: 'page1',
    target: 'page2',
    type: 'default',
    animated: true,
    style: {
      stroke: '#4ecdc4',
      strokeWidth: 2,
    },
  },
];

describe('FormSynchronizationService', () => {
  let service: FormSynchronizationService;

  beforeEach(() => {
    service = new FormSynchronizationService();
  });

  describe('subscribeToFormChanges', () => {
    it('should subscribe to form changes and return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribeToFormChanges(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should notify subscribers when form changes', () => {
      const callback = vi.fn();
      service.subscribeToFormChanges(callback);

      // Trigger a form change
      service.updateFromFlow(mockNodes, mockEdges, mockFormDefinition);

      expect(callback).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should unsubscribe when unsubscribe function is called', () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribeToFormChanges(callback);

      unsubscribe();

      // Trigger a form change
      service.updateFromFlow(mockNodes, mockEdges, mockFormDefinition);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('updateFromFlow', () => {
    it('should update form from flow nodes and edges', () => {
      const result = service.updateFromFlow(
        mockNodes,
        mockEdges,
        mockFormDefinition
      );

      expect(result).toBeDefined();
      expect(result.app.title).toBe('Test Form');
      expect(result.app.pages).toHaveLength(2);
    });

    it('should handle single edge connections correctly', () => {
      const result = service.updateFromFlow(
        mockNodes,
        mockEdges,
        mockFormDefinition
      );

      const page1 = result.app.pages.find((p) => p.id === 'page1');
      expect(page1?.nextPage).toBe('page2');
      expect(page1?.branches).toBeUndefined();
    });

    it('should handle multiple edge connections as branches', () => {
      const multipleEdges: Edge[] = [
        {
          id: 'page1-to-page2',
          source: 'page1',
          target: 'page2',
          type: 'smoothstep',
          label: 'condition1 == value1',
          style: { stroke: '#ff6b6b' },
        },
        {
          id: 'page1-to-page3',
          source: 'page1',
          target: 'page3',
          type: 'smoothstep',
          label: 'condition2 == value2',
          style: { stroke: '#ff6b6b' },
        },
      ];

      const result = service.updateFromFlow(
        mockNodes,
        multipleEdges,
        mockFormDefinition
      );

      const page1 = result.app.pages.find((p) => p.id === 'page1');
      expect(page1?.nextPage).toBeUndefined();
      expect(page1?.branches).toHaveLength(2);
      expect(page1?.branches?.[0].nextPage).toBe('page2');
      expect(page1?.branches?.[1].nextPage).toBe('page3');
    });

    it('should preserve thank you page configuration', () => {
      const formWithThankYou: FormDefinition = {
        ...mockFormDefinition,
        app: {
          ...mockFormDefinition.app,
          thankYouPage: {
            title: 'Thank You',
            message: 'Thank you for your submission!',
            showRestartButton: true,
          },
        },
      };

      const result = service.updateFromFlow(
        mockNodes,
        mockEdges,
        formWithThankYou
      );

      expect(result.app.thankYouPage).toBeDefined();
      expect(result.app.thankYouPage?.title).toBe('Thank You');
    });

    it('should track changes in history', () => {
      const historyBefore = service.getChangeHistory();
      service.updateFromFlow(mockNodes, mockEdges, mockFormDefinition);
      const historyAfter = service.getChangeHistory();

      expect(historyAfter.length).toBe(historyBefore.length + 1);
      expect(historyAfter[historyAfter.length - 1].type).toBe(
        'form_structure_change'
      );
      expect(historyAfter[historyAfter.length - 1].source).toBe('flow');
    });
  });

  describe('updateFromJson', () => {
    it('should update form from valid JSON string', () => {
      const jsonString = JSON.stringify(mockFormDefinition);
      const result = service.updateFromJson(jsonString);

      expect(result).toBeDefined();
      expect(result?.app.title).toBe('Test Form');
      expect(result?.app.pages).toHaveLength(2);
    });

    it('should return null for invalid JSON', () => {
      const invalidJson = '{ invalid json }';
      const result = service.updateFromJson(invalidJson);

      expect(result).toBeNull();
    });

    it('should return null for invalid form structure', () => {
      const invalidForm = { invalid: 'structure' };
      const result = service.updateFromJson(JSON.stringify(invalidForm));

      expect(result).toBeNull();
    });

    it('should track changes in history', () => {
      const historyBefore = service.getChangeHistory();
      const jsonString = JSON.stringify(mockFormDefinition);
      service.updateFromJson(jsonString);
      const historyAfter = service.getChangeHistory();

      expect(historyAfter.length).toBe(historyBefore.length + 1);
      expect(historyAfter[historyAfter.length - 1].type).toBe('json_edit');
      expect(historyAfter[historyAfter.length - 1].source).toBe('json');
    });
  });

  describe('validateFormConsistency', () => {
    it('should validate correct form structure', () => {
      const result = service.validateFormConsistency(mockFormDefinition);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing app property', () => {
      const invalidForm = {} as FormDefinition;
      const result = service.validateFormConsistency(invalidForm);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Form must have an app property');
    });

    it('should detect missing title', () => {
      const invalidForm = {
        app: {
          pages: [],
        },
      } as FormDefinition;
      const result = service.validateFormConsistency(invalidForm);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Form must have a title');
    });

    it('should detect missing pages array', () => {
      const invalidForm = {
        app: {
          title: 'Test',
        },
      } as FormDefinition;
      const result = service.validateFormConsistency(invalidForm);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Form must have pages array');
    });

    it('should detect invalid page connections', () => {
      const invalidForm: FormDefinition = {
        app: {
          title: 'Test Form',
          pages: [
            {
              id: 'page1',
              title: 'First Page',
              route: '/page1',
              layout: 'vertical',
              components: [],
              nextPage: 'nonexistent-page',
            },
          ],
        },
      };

      const result = service.validateFormConsistency(invalidForm);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((error) =>
          error.includes('references non-existent nextPage')
        )
      ).toBe(true);
    });

    it('should detect duplicate page IDs', () => {
      const invalidForm: FormDefinition = {
        app: {
          title: 'Test Form',
          pages: [
            {
              id: 'page1',
              title: 'First Page',
              route: '/page1',
              layout: 'vertical',
              components: [],
            },
            {
              id: 'page1', // Duplicate ID
              title: 'Second Page',
              route: '/page2',
              layout: 'vertical',
              components: [],
            },
          ],
        },
      };

      const result = service.validateFormConsistency(invalidForm);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((error) =>
          error.includes('Duplicate page id: page1')
        )
      ).toBe(true);
    });
  });

  describe('resolveConflicts', () => {
    it('should return flow form when no conflicts detected', () => {
      const result = service.resolveConflicts(
        mockFormDefinition,
        mockFormDefinition
      );

      expect(result).toBe(mockFormDefinition);
    });

    it('should detect and handle conflicts between forms', () => {
      const flowForm: FormDefinition = {
        ...mockFormDefinition,
        app: {
          ...mockFormDefinition.app,
          title: 'Flow Form Title',
          pages: [
            {
              ...mockFormDefinition.app.pages[0],
              title: 'Flow Page Title',
            },
            mockFormDefinition.app.pages[1],
          ],
        },
      };

      const jsonForm: FormDefinition = {
        ...mockFormDefinition,
        app: {
          ...mockFormDefinition.app,
          title: 'JSON Form Title',
          pages: [
            {
              ...mockFormDefinition.app.pages[0],
              title: 'JSON Page Title',
            },
            mockFormDefinition.app.pages[1],
          ],
        },
      };

      const result = service.resolveConflicts(flowForm, jsonForm);

      expect(result).toBeDefined();
      expect(service.getActiveConflicts()).toHaveLength(1);
    });

    it('should clear conflicts when requested', () => {
      const flowForm: FormDefinition = {
        ...mockFormDefinition,
        app: {
          ...mockFormDefinition.app,
          title: 'Flow Form Title',
          pages: [
            {
              ...mockFormDefinition.app.pages[0],
              title: 'Flow Page Title',
            },
            mockFormDefinition.app.pages[1],
          ],
        },
      };

      const jsonForm: FormDefinition = {
        ...mockFormDefinition,
        app: {
          ...mockFormDefinition.app,
          title: 'JSON Form Title',
          pages: [
            {
              ...mockFormDefinition.app.pages[0],
              title: 'JSON Page Title',
            },
            mockFormDefinition.app.pages[1],
          ],
        },
      };

      service.resolveConflicts(flowForm, jsonForm);
      expect(service.getActiveConflicts()).toHaveLength(1);

      const conflict = service.getActiveConflicts()[0];
      service.clearConflict(conflict.id);
      expect(service.getActiveConflicts()).toHaveLength(0);
    });
  });

  describe('change tracking', () => {
    it('should limit change history size', () => {
      // Create a service with small history limit for testing
      const limitedService = new FormSynchronizationService();
      // Access private property for testing
      (limitedService as any).maxHistorySize = 3;

      // Add more changes than the limit
      for (let i = 0; i < 5; i++) {
        limitedService.updateFromJson(JSON.stringify(mockFormDefinition));
      }

      const history = limitedService.getChangeHistory();
      expect(history.length).toBeLessThanOrEqual(3);
    });

    it('should generate unique change IDs', () => {
      const historyBefore = service.getChangeHistory();
      service.updateFromJson(JSON.stringify(mockFormDefinition));
      service.updateFromJson(JSON.stringify(mockFormDefinition));
      const historyAfter = service.getChangeHistory();

      const newChanges = historyAfter.slice(historyBefore.length);
      const changeIds = newChanges.map((change) => change.id);
      const uniqueIds = new Set(changeIds);

      expect(uniqueIds.size).toBe(changeIds.length);
    });
  });

  describe('error handling', () => {
    it('should handle errors in subscriber callbacks gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Subscriber error');
      });
      const normalCallback = vi.fn();

      service.subscribeToFormChanges(errorCallback);
      service.subscribeToFormChanges(normalCallback);

      // Should not throw and should call normal callback
      expect(() => {
        service.updateFromFlow(mockNodes, mockEdges, mockFormDefinition);
      }).not.toThrow();

      expect(normalCallback).toHaveBeenCalled();
    });

    it('should handle malformed node data gracefully', () => {
      const malformedNodes: Node[] = [
        {
          id: 'page1',
          type: 'tooltip',
          position: { x: 0, y: 0 },
          data: {
            // Missing page data
          },
        },
      ];

      expect(() => {
        service.updateFromFlow(malformedNodes, mockEdges, mockFormDefinition);
      }).not.toThrow();
    });
  });
});
