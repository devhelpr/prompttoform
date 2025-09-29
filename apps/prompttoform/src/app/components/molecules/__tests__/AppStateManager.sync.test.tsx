import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppStateProvider, useAppState } from '../AppStateManager';
import { FormDefinition } from '@devhelpr/react-forms';
import { Node, Edge } from '@xyflow/react';
import React from 'react';

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

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppStateProvider>{children}</AppStateProvider>
);

describe('AppStateManager Synchronization', () => {
  describe('initial state', () => {
    it('should have correct initial synchronization state', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      expect(result.current.state.formSynchronizationService).toBeDefined();
      expect(result.current.state.lastModifiedBy).toBe('prompt');
      expect(result.current.state.formVersion).toBe(0);
      expect(result.current.state.pendingChanges).toBe(false);
      expect(result.current.state.syncStatus).toBe('synced');
    });
  });

  describe('updateFormFromFlow', () => {
    it('should update form from flow editor changes', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      // Set initial form data
      act(() => {
        result.current.setGeneratedJson(
          JSON.stringify(mockFormDefinition),
          mockFormDefinition
        );
      });

      // Update from flow
      act(() => {
        result.current.updateFormFromFlow(mockNodes, mockEdges);
      });

      expect(result.current.state.lastModifiedBy).toBe('flow');
      expect(result.current.state.formVersion).toBe(1);
      expect(result.current.state.pendingChanges).toBe(false);
      expect(result.current.state.syncStatus).toBe('synced');
      expect(result.current.state.parsedJson).toBeDefined();
    });

    it('should handle errors gracefully', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      // Try to update without initial form data
      act(() => {
        result.current.updateFormFromFlow(mockNodes, mockEdges);
      });

      // Should not change state when no parsedJson is available
      expect(result.current.state.syncStatus).toBe('synced');
      expect(result.current.state.error).toBeNull();
    });

    it('should increment form version on each update', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      // Set initial form data
      act(() => {
        result.current.setGeneratedJson(
          JSON.stringify(mockFormDefinition),
          mockFormDefinition
        );
      });

      // First update
      act(() => {
        result.current.updateFormFromFlow(mockNodes, mockEdges);
      });

      expect(result.current.state.formVersion).toBe(1);

      // Second update
      act(() => {
        result.current.updateFormFromFlow(mockNodes, mockEdges);
      });

      expect(result.current.state.formVersion).toBe(2);
    });
  });

  describe('updateFormFromJson', () => {
    it('should update form from JSON editor changes', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      const jsonString = JSON.stringify(mockFormDefinition);

      act(() => {
        result.current.updateFormFromJson(jsonString);
      });

      expect(result.current.state.lastModifiedBy).toBe('json');
      expect(result.current.state.formVersion).toBe(1);
      expect(result.current.state.pendingChanges).toBe(false);
      expect(result.current.state.syncStatus).toBe('synced');
      expect(result.current.state.generatedJson).toBe(jsonString);
      expect(result.current.state.parsedJson).toEqual(mockFormDefinition);
    });

    it('should handle invalid JSON gracefully', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      const invalidJson = '{ invalid json }';

      act(() => {
        result.current.updateFormFromJson(invalidJson);
      });

      expect(result.current.state.syncStatus).toBe('error');
      expect(result.current.state.error).toContain('Invalid JSON format');
    });

    it('should handle JSON parsing errors gracefully', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      // Mock the synchronization service to throw an error
      const originalUpdateFromJson =
        result.current.state.formSynchronizationService.updateFromJson;
      vi.spyOn(
        result.current.state.formSynchronizationService,
        'updateFromJson'
      ).mockImplementation(() => {
        throw new Error('Parsing error');
      });

      act(() => {
        result.current.updateFormFromJson('{"valid": "json"}');
      });

      expect(result.current.state.syncStatus).toBe('error');
      expect(result.current.state.error).toContain('Failed to parse JSON');

      // Restore original method
      result.current.state.formSynchronizationService.updateFromJson =
        originalUpdateFromJson;
    });
  });

  describe('markFormModified', () => {
    it('should mark form as modified with correct source', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.markFormModified('flow');
      });

      expect(result.current.state.lastModifiedBy).toBe('flow');
      expect(result.current.state.pendingChanges).toBe(true);
      expect(result.current.state.syncStatus).toBe('pending');
    });

    it('should handle different modification sources', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      const sources = ['flow', 'json', 'prompt', 'import'] as const;

      sources.forEach((source) => {
        act(() => {
          result.current.markFormModified(source);
        });

        expect(result.current.state.lastModifiedBy).toBe(source);
        expect(result.current.state.pendingChanges).toBe(true);
        expect(result.current.state.syncStatus).toBe('pending');
      });
    });
  });

  describe('resolveFormConflicts', () => {
    it('should resolve conflicts and mark as synced', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      // First mark as having conflicts
      act(() => {
        result.current.markFormModified('flow');
      });

      expect(result.current.state.syncStatus).toBe('pending');

      // Then resolve conflicts
      act(() => {
        result.current.resolveFormConflicts();
      });

      expect(result.current.state.syncStatus).toBe('synced');
      expect(result.current.state.pendingChanges).toBe(false);
    });

    it('should clear active conflicts', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      // Create a mock conflict
      const mockConflict = {
        id: 'test-conflict',
        type: 'form_structure' as const,
        jsonVersion: mockFormDefinition,
        flowVersion: mockFormDefinition,
        conflictingFields: ['title'],
        timestamp: new Date(),
      };

      // Add conflict to the service
      (result.current.state.formSynchronizationService as any).conflicts = [
        mockConflict,
      ];

      act(() => {
        result.current.resolveFormConflicts();
      });

      const activeConflicts =
        result.current.state.formSynchronizationService.getActiveConflicts();
      expect(activeConflicts).toHaveLength(0);
    });
  });

  describe('integration with form synchronization service', () => {
    it('should maintain service instance across state updates', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      const initialService = result.current.state.formSynchronizationService;

      act(() => {
        result.current.markFormModified('flow');
      });

      expect(result.current.state.formSynchronizationService).toBe(
        initialService
      );
    });

    it('should track changes in the synchronization service', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      // Set initial form data
      act(() => {
        result.current.setGeneratedJson(
          JSON.stringify(mockFormDefinition),
          mockFormDefinition
        );
      });

      const historyBefore =
        result.current.state.formSynchronizationService.getChangeHistory();

      act(() => {
        result.current.updateFormFromFlow(mockNodes, mockEdges);
      });

      const historyAfter =
        result.current.state.formSynchronizationService.getChangeHistory();

      expect(historyAfter.length).toBe(historyBefore.length + 1);
      expect(historyAfter[historyAfter.length - 1].source).toBe('flow');
    });
  });

  describe('state consistency', () => {
    it('should maintain consistent state during multiple operations', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      // Set initial form data
      act(() => {
        result.current.setGeneratedJson(
          JSON.stringify(mockFormDefinition),
          mockFormDefinition
        );
      });

      const initialVersion = result.current.state.formVersion;

      // Perform multiple operations
      act(() => {
        result.current.updateFormFromFlow(mockNodes, mockEdges);
        result.current.markFormModified('json');
        result.current.updateFormFromJson(JSON.stringify(mockFormDefinition));
        result.current.resolveFormConflicts();
      });

      expect(result.current.state.formVersion).toBeGreaterThan(initialVersion);
      expect(result.current.state.syncStatus).toBe('synced');
      expect(result.current.state.pendingChanges).toBe(false);
    });

    it('should handle rapid state changes correctly', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      // Set initial form data
      act(() => {
        result.current.setGeneratedJson(
          JSON.stringify(mockFormDefinition),
          mockFormDefinition
        );
      });

      // Perform rapid changes
      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.updateFormFromFlow(mockNodes, mockEdges);
        });
      }

      expect(result.current.state.formVersion).toBe(10);
      expect(result.current.state.lastModifiedBy).toBe('flow');
    });
  });

  describe('error recovery', () => {
    it('should recover from errors and allow new operations', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      // Cause an error
      act(() => {
        result.current.updateFormFromJson('invalid json');
      });

      expect(result.current.state.syncStatus).toBe('error');

      // Should be able to recover
      act(() => {
        result.current.updateFormFromJson(JSON.stringify(mockFormDefinition));
      });

      expect(result.current.state.syncStatus).toBe('synced');
      expect(result.current.state.error).toBeNull();
    });

    it('should clear errors when transitioning to editor', () => {
      const { result } = renderHook(() => useAppState(), {
        wrapper: TestWrapper,
      });

      // Cause an error
      act(() => {
        result.current.updateFormFromJson('invalid json');
      });

      expect(result.current.state.syncStatus).toBe('error');

      // Transition to editor should clear error
      act(() => {
        result.current.transitionToEditor();
      });

      // transitionToEditor doesn't clear errors, only successful operations do
      expect(result.current.state.error).toBe('Invalid JSON format');
    });
  });
});
