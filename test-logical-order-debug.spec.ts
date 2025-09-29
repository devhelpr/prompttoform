import { test, expect } from '@playwright/test';
import { calculateLogicalPageOrder } from './libs/react-forms/src/lib/utils/page-ordering';

test.describe('Logical Order Debug Test', () => {
  test('should debug logical page order calculation', () => {
    // Test the logical page order calculation directly
    const wrongOrderFormJson = {
      app: {
        title: 'Wrong Order Test',
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

    const logicalOrder = calculateLogicalPageOrder(wrongOrderFormJson);

    console.log('Logical page order:', logicalOrder);

    // The logical order should be: page1 -> page2 -> page3
    expect(logicalOrder).toHaveLength(3);
    expect(logicalOrder[0].pageId).toBe('page1');
    expect(logicalOrder[1].pageId).toBe('page2');
    expect(logicalOrder[2].pageId).toBe('page3');

    console.log('✅ Logical page order is correct: page1 -> page2 -> page3');
  });
});
