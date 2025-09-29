import { describe, it, expect } from 'vitest';
import {
  calculateLogicalPageOrder,
  getLogicalPageIndex,
  getLogicalPageCount,
  isFirstLogicalPage,
  isLastLogicalPage,
} from '../page-ordering';
import { FormDefinition } from '../../interfaces/form-interfaces';

describe('Page Ordering Utilities', () => {
  describe('calculateLogicalPageOrder', () => {
    it('should order pages in a simple linear flow', () => {
      const formDefinition: FormDefinition = {
        app: {
          title: 'Test Form',
          pages: [
            {
              id: 'page1',
              title: 'First Page',
              route: '/page1',
              components: [],
              nextPage: 'page2',
            },
            {
              id: 'page2',
              title: 'Second Page',
              route: '/page2',
              components: [],
              nextPage: 'page3',
            },
            {
              id: 'page3',
              title: 'Third Page',
              route: '/page3',
              components: [],
            },
          ],
        },
      };

      const logicalOrder = calculateLogicalPageOrder(formDefinition);

      expect(logicalOrder).toHaveLength(3);
      expect(logicalOrder[0].pageId).toBe('page1');
      expect(logicalOrder[0].logicalIndex).toBe(0);
      expect(logicalOrder[1].pageId).toBe('page2');
      expect(logicalOrder[1].logicalIndex).toBe(1);
      expect(logicalOrder[2].pageId).toBe('page3');
      expect(logicalOrder[2].logicalIndex).toBe(2);
    });

    it('should handle pages in wrong array order', () => {
      const formDefinition: FormDefinition = {
        app: {
          title: 'Test Form',
          pages: [
            {
              id: 'page3',
              title: 'Third Page',
              route: '/page3',
              components: [],
            },
            {
              id: 'page1',
              title: 'First Page',
              route: '/page1',
              components: [],
              nextPage: 'page2',
            },
            {
              id: 'page2',
              title: 'Second Page',
              route: '/page2',
              components: [],
              nextPage: 'page3',
            },
          ],
        },
      };

      const logicalOrder = calculateLogicalPageOrder(formDefinition);

      expect(logicalOrder).toHaveLength(3);
      expect(logicalOrder[0].pageId).toBe('page1');
      expect(logicalOrder[1].pageId).toBe('page2');
      expect(logicalOrder[2].pageId).toBe('page3');
    });

    it('should handle branching flows', () => {
      const formDefinition: FormDefinition = {
        app: {
          title: 'Test Form',
          pages: [
            {
              id: 'page1',
              title: 'First Page',
              route: '/page1',
              components: [],
              branches: [
                {
                  condition: { field: 'type', operator: '==', value: 'A' },
                  nextPage: 'page2',
                },
                {
                  condition: { field: 'type', operator: '==', value: 'B' },
                  nextPage: 'page3',
                },
              ],
            },
            {
              id: 'page2',
              title: 'Page A',
              route: '/page2',
              components: [],
              nextPage: 'page4',
            },
            {
              id: 'page3',
              title: 'Page B',
              route: '/page3',
              components: [],
              nextPage: 'page4',
            },
            {
              id: 'page4',
              title: 'Final Page',
              route: '/page4',
              components: [],
            },
          ],
        },
      };

      const logicalOrder = calculateLogicalPageOrder(formDefinition);

      expect(logicalOrder).toHaveLength(4);
      expect(logicalOrder[0].pageId).toBe('page1');
      // page2 and page3 can be in any order after page1
      expect(['page2', 'page3']).toContain(logicalOrder[1].pageId);
      expect(['page2', 'page3']).toContain(logicalOrder[2].pageId);
      expect(logicalOrder[3].pageId).toBe('page4');
    });

    it('should handle orphaned pages', () => {
      const formDefinition: FormDefinition = {
        app: {
          title: 'Test Form',
          pages: [
            {
              id: 'page1',
              title: 'First Page',
              route: '/page1',
              components: [],
              nextPage: 'page2',
            },
            {
              id: 'page2',
              title: 'Second Page',
              route: '/page2',
              components: [],
            },
            {
              id: 'orphan',
              title: 'Orphaned Page',
              route: '/orphan',
              components: [],
            },
          ],
        },
      };

      const logicalOrder = calculateLogicalPageOrder(formDefinition);

      expect(logicalOrder).toHaveLength(3);
      expect(logicalOrder[0].pageId).toBe('page1');
      expect(logicalOrder[1].pageId).toBe('page2');
      expect(logicalOrder[2].pageId).toBe('orphan');
    });
  });

  describe('getLogicalPageIndex', () => {
    it('should return correct logical index for a page', () => {
      const formDefinition: FormDefinition = {
        app: {
          title: 'Test Form',
          pages: [
            {
              id: 'page1',
              title: 'First Page',
              route: '/page1',
              components: [],
              nextPage: 'page2',
            },
            {
              id: 'page2',
              title: 'Second Page',
              route: '/page2',
              components: [],
            },
          ],
        },
      };

      const logicalOrder = calculateLogicalPageOrder(formDefinition);

      expect(getLogicalPageIndex('page1', logicalOrder)).toBe(0);
      expect(getLogicalPageIndex('page2', logicalOrder)).toBe(1);
      expect(getLogicalPageIndex('nonexistent', logicalOrder)).toBe(-1);
    });
  });

  describe('getLogicalPageCount', () => {
    it('should return correct count of logical pages', () => {
      const formDefinition: FormDefinition = {
        app: {
          title: 'Test Form',
          pages: [
            {
              id: 'page1',
              title: 'First Page',
              route: '/page1',
              components: [],
              nextPage: 'page2',
            },
            {
              id: 'page2',
              title: 'Second Page',
              route: '/page2',
              components: [],
            },
          ],
        },
      };

      const logicalOrder = calculateLogicalPageOrder(formDefinition);

      expect(getLogicalPageCount(logicalOrder)).toBe(2);
    });
  });

  describe('isFirstLogicalPage', () => {
    it('should correctly identify first page', () => {
      const formDefinition: FormDefinition = {
        app: {
          title: 'Test Form',
          pages: [
            {
              id: 'page1',
              title: 'First Page',
              route: '/page1',
              components: [],
              nextPage: 'page2',
            },
            {
              id: 'page2',
              title: 'Second Page',
              route: '/page2',
              components: [],
            },
          ],
        },
      };

      const logicalOrder = calculateLogicalPageOrder(formDefinition);

      expect(isFirstLogicalPage('page1', logicalOrder)).toBe(true);
      expect(isFirstLogicalPage('page2', logicalOrder)).toBe(false);
    });
  });

  describe('isLastLogicalPage', () => {
    it('should correctly identify last page', () => {
      const formDefinition: FormDefinition = {
        app: {
          title: 'Test Form',
          pages: [
            {
              id: 'page1',
              title: 'First Page',
              route: '/page1',
              components: [],
              nextPage: 'page2',
            },
            {
              id: 'page2',
              title: 'Second Page',
              route: '/page2',
              components: [],
            },
          ],
        },
      };

      const logicalOrder = calculateLogicalPageOrder(formDefinition);

      expect(isLastLogicalPage('page1', logicalOrder)).toBe(false);
      expect(isLastLogicalPage('page2', logicalOrder)).toBe(true);
    });
  });
});
