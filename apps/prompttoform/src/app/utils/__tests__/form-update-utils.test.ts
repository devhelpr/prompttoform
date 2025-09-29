import { describe, it, expect, beforeEach } from 'vitest';
import {
  updateFormDefinition,
  updateFormConnections,
  addPageToForm,
  removePageFromForm,
  updatePageComponents,
  updatePageTitle,
  updatePageRoute,
  updatePageLayout,
  updatePageEndStatus,
  updateFormTitle,
  updateThankYouPage,
  validateFormStructure,
  getPageById,
  getAllPageIds,
  pageExists,
  getPagesReferencing,
} from '../form-update-utils';
import { FormDefinition, PageProps } from '@devhelpr/react-forms';
import { Edge } from '@xyflow/react';

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

describe('form-update-utils', () => {
  describe('updateFormDefinition', () => {
    it('should update specific page in form definition', () => {
      const updatedPageData = {
        title: 'Updated First Page',
        route: '/updated-page1',
        layout: 'horizontal' as const,
        components: [
          {
            type: 'input' as const,
            id: 'updated-field1',
            label: 'Updated Name',
            props: {
              placeholder: 'Enter your updated name',
              inputType: 'text' as const,
            },
          },
        ],
      };

      const result = updateFormDefinition(
        mockFormDefinition,
        'page1',
        updatedPageData
      );

      expect(result.app.pages[0].title).toBe('Updated First Page');
      expect(result.app.pages[0].route).toBe('/updated-page1');
      expect(result.app.pages[0].layout).toBe('horizontal');
      expect(result.app.pages[0].components[0].id).toBe('updated-field1');
    });

    it('should not modify other pages', () => {
      const updatedPageData = {
        title: 'Updated First Page',
        route: '/page1',
        layout: 'vertical' as const,
        components: mockFormDefinition.app.pages[0].components,
      };

      const result = updateFormDefinition(
        mockFormDefinition,
        'page1',
        updatedPageData
      );

      expect(result.app.pages[1]).toEqual(mockFormDefinition.app.pages[1]);
    });

    it('should return original form if page not found', () => {
      const updatedPageData = {
        title: 'Updated Page',
        route: '/page1',
        layout: 'vertical' as const,
        components: [],
      };

      const result = updateFormDefinition(
        mockFormDefinition,
        'nonexistent',
        updatedPageData
      );

      expect(result).toEqual(mockFormDefinition);
    });
  });

  describe('updateFormConnections', () => {
    it('should handle no edges by removing connections', () => {
      const edges: Edge[] = [];
      const result = updateFormConnections(mockFormDefinition, edges);

      expect(result.app.pages[0].nextPage).toBeUndefined();
      expect(result.app.pages[0].branches).toBeUndefined();
    });

    it('should handle single edge by setting nextPage', () => {
      const edges: Edge[] = [
        {
          id: 'page1-to-page2',
          source: 'page1',
          target: 'page2',
          type: 'default',
        },
      ];

      const result = updateFormConnections(mockFormDefinition, edges);

      expect(result.app.pages[0].nextPage).toBe('page2');
      expect(result.app.pages[0].branches).toBeUndefined();
    });

    it('should handle multiple edges by creating branches', () => {
      const edges: Edge[] = [
        {
          id: 'page1-to-page2',
          source: 'page1',
          target: 'page2',
          type: 'smoothstep',
          label: 'condition1 == value1',
        },
        {
          id: 'page1-to-page3',
          source: 'page1',
          target: 'page3',
          type: 'smoothstep',
          label: 'condition2 == value2',
        },
      ];

      const result = updateFormConnections(mockFormDefinition, edges);

      expect(result.app.pages[0].nextPage).toBeUndefined();
      expect(result.app.pages[0].branches).toHaveLength(2);
      expect(result.app.pages[0].branches?.[0].nextPage).toBe('page2');
      expect(result.app.pages[0].branches?.[1].nextPage).toBe('page3');
    });

    it('should extract conditions from edge labels', () => {
      const edges: Edge[] = [
        {
          id: 'page1-to-page2',
          source: 'page1',
          target: 'page2',
          type: 'smoothstep',
          label: 'age > 18',
        },
        {
          id: 'page1-to-page3',
          source: 'page1',
          target: 'page3',
          type: 'smoothstep',
          label: 'status == active',
        },
      ];

      const result = updateFormConnections(mockFormDefinition, edges);

      expect(result.app.pages[0].branches?.[0].condition.field).toBe('age');
      expect(result.app.pages[0].branches?.[0].condition.operator).toBe('>');
      expect(result.app.pages[0].branches?.[0].condition.value).toBe('18');
    });

    it('should generate default conditions when no label', () => {
      const edges: Edge[] = [
        {
          id: 'page1-to-page2',
          source: 'page1',
          target: 'page2',
          type: 'smoothstep',
        },
        {
          id: 'page1-to-page3',
          source: 'page1',
          target: 'page3',
          type: 'smoothstep',
        },
      ];

      const result = updateFormConnections(mockFormDefinition, edges);

      expect(result.app.pages[0].branches?.[0].condition.field).toBe(
        'condition_1'
      );
      expect(result.app.pages[0].branches?.[0].condition.operator).toBe('==');
      expect(result.app.pages[0].branches?.[0].condition.value).toBe('value_1');
    });
  });

  describe('addPageToForm', () => {
    it('should add new page to form definition', () => {
      const newPage: PageProps = {
        id: 'page3',
        title: 'Third Page',
        route: '/page3',
        layout: 'vertical',
        components: [
          {
            type: 'input',
            id: 'field3',
            label: 'Phone',
            props: {
              placeholder: 'Enter your phone',
              inputType: 'tel',
            },
          },
        ],
      };

      const result = addPageToForm(mockFormDefinition, newPage);

      expect(result.app.pages).toHaveLength(3);
      expect(result.app.pages[2]).toEqual(newPage);
    });
  });

  describe('removePageFromForm', () => {
    it('should remove page from form definition', () => {
      const result = removePageFromForm(mockFormDefinition, 'page1');

      expect(result.app.pages).toHaveLength(1);
      expect(result.app.pages[0].id).toBe('page2');
    });

    it('should remove references to deleted page', () => {
      const formWithReferences: FormDefinition = {
        ...mockFormDefinition,
        app: {
          ...mockFormDefinition.app,
          pages: [
            {
              ...mockFormDefinition.app.pages[0],
              nextPage: 'page2',
            },
            {
              ...mockFormDefinition.app.pages[1],
              branches: [
                {
                  condition: { field: 'test', operator: '==', value: 'true' },
                  nextPage: 'page1',
                },
              ],
            },
          ],
        },
      };

      const result = removePageFromForm(formWithReferences, 'page1');

      expect(result.app.pages[0].nextPage).toBeUndefined();
      expect(result.app.pages[0].branches).toBeUndefined();
    });
  });

  describe('updatePageComponents', () => {
    it('should update page components', () => {
      const newComponents = [
        {
          type: 'input' as const,
          id: 'new-field',
          label: 'New Field',
          props: {
            placeholder: 'Enter new value',
            inputType: 'text' as const,
          },
        },
      ];

      const result = updatePageComponents(
        mockFormDefinition,
        'page1',
        newComponents
      );

      expect(result.app.pages[0].components).toEqual(newComponents);
    });
  });

  describe('updatePageTitle', () => {
    it('should update page title', () => {
      const result = updatePageTitle(mockFormDefinition, 'page1', 'New Title');

      expect(result.app.pages[0].title).toBe('New Title');
    });
  });

  describe('updatePageRoute', () => {
    it('should update page route', () => {
      const result = updatePageRoute(mockFormDefinition, 'page1', '/new-route');

      expect(result.app.pages[0].route).toBe('/new-route');
    });
  });

  describe('updatePageLayout', () => {
    it('should update page layout', () => {
      const result = updatePageLayout(
        mockFormDefinition,
        'page1',
        'horizontal'
      );

      expect(result.app.pages[0].layout).toBe('horizontal');
    });
  });

  describe('updatePageEndStatus', () => {
    it('should update page end status', () => {
      const result = updatePageEndStatus(mockFormDefinition, 'page1', true);

      expect(result.app.pages[0].isEndPage).toBe(true);
    });
  });

  describe('updateFormTitle', () => {
    it('should update form title', () => {
      const result = updateFormTitle(mockFormDefinition, 'New Form Title');

      expect(result.app.title).toBe('New Form Title');
    });
  });

  describe('updateThankYouPage', () => {
    it('should update thank you page configuration', () => {
      const thankYouPage = {
        title: 'Thank You!',
        message: 'Thank you for your submission!',
        showRestartButton: true,
      };

      const result = updateThankYouPage(mockFormDefinition, thankYouPage);

      expect(result.app.thankYouPage).toEqual(thankYouPage);
    });
  });

  describe('validateFormStructure', () => {
    it('should validate correct form structure', () => {
      const result = validateFormStructure(mockFormDefinition);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing app property', () => {
      const invalidForm = {} as FormDefinition;
      const result = validateFormStructure(invalidForm);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Form must have an app property');
    });

    it('should detect missing title', () => {
      const invalidForm = {
        app: {
          pages: [],
        },
      } as FormDefinition;
      const result = validateFormStructure(invalidForm);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Form must have a title');
    });

    it('should detect missing pages array', () => {
      const invalidForm = {
        app: {
          title: 'Test',
        },
      } as FormDefinition;
      const result = validateFormStructure(invalidForm);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Form must have pages array');
    });

    it('should detect empty pages array', () => {
      const invalidForm: FormDefinition = {
        app: {
          title: 'Test Form',
          pages: [],
        },
      };
      const result = validateFormStructure(invalidForm);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Form must have at least one page');
    });

    it('should detect missing page properties', () => {
      const invalidForm: FormDefinition = {
        app: {
          title: 'Test Form',
          pages: [
            {
              id: '',
              title: '',
              route: '',
              layout: 'vertical',
              components: [],
            },
          ],
        },
      };
      const result = validateFormStructure(invalidForm);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((error) => error.includes('must have an id'))
      ).toBe(true);
      expect(
        result.errors.some((error) => error.includes('must have a title'))
      ).toBe(true);
      expect(
        result.errors.some((error) => error.includes('must have a route'))
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
      const result = validateFormStructure(invalidForm);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((error) =>
          error.includes('Duplicate page id: page1')
        )
      ).toBe(true);
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
      const result = validateFormStructure(invalidForm);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((error) =>
          error.includes('references non-existent nextPage')
        )
      ).toBe(true);
    });

    it('should detect invalid branch connections', () => {
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
              branches: [
                {
                  condition: { field: 'test', operator: '==', value: 'true' },
                  nextPage: 'nonexistent-page',
                },
              ],
            },
          ],
        },
      };
      const result = validateFormStructure(invalidForm);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((error) =>
          error.includes('references non-existent nextPage')
        )
      ).toBe(true);
    });

    it('should detect missing branch properties', () => {
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
              branches: [
                {
                  condition: { field: '', operator: '', value: 'true' },
                  nextPage: 'page2',
                },
              ],
            },
            {
              id: 'page2',
              title: 'Second Page',
              route: '/page2',
              layout: 'vertical',
              components: [],
            },
          ],
        },
      };
      const result = validateFormStructure(invalidForm);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((error) =>
          error.includes('condition must have a field')
        )
      ).toBe(true);
      expect(
        result.errors.some((error) =>
          error.includes('condition must have an operator')
        )
      ).toBe(true);
    });

    it('should warn about pages with no components', () => {
      const formWithEmptyPage: FormDefinition = {
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
          ],
        },
      };
      const result = validateFormStructure(formWithEmptyPage);

      expect(result.isValid).toBe(true);
      expect(
        result.warnings.some((warning) => warning.includes('has no components'))
      ).toBe(true);
    });
  });

  describe('getPageById', () => {
    it('should return page by ID', () => {
      const result = getPageById(mockFormDefinition, 'page1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('page1');
      expect(result?.title).toBe('First Page');
    });

    it('should return undefined for non-existent page', () => {
      const result = getPageById(mockFormDefinition, 'nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('getAllPageIds', () => {
    it('should return all page IDs', () => {
      const result = getAllPageIds(mockFormDefinition);

      expect(result).toEqual(['page1', 'page2']);
    });
  });

  describe('pageExists', () => {
    it('should return true for existing page', () => {
      const result = pageExists(mockFormDefinition, 'page1');

      expect(result).toBe(true);
    });

    it('should return false for non-existent page', () => {
      const result = pageExists(mockFormDefinition, 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getPagesReferencing', () => {
    it('should return pages that reference a specific page via nextPage', () => {
      const result = getPagesReferencing(mockFormDefinition, 'page2');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('page1');
    });

    it('should return pages that reference a specific page via branches', () => {
      const formWithBranches: FormDefinition = {
        ...mockFormDefinition,
        app: {
          ...mockFormDefinition.app,
          pages: [
            {
              ...mockFormDefinition.app.pages[0],
              nextPage: undefined,
              branches: [
                {
                  condition: { field: 'test', operator: '==', value: 'true' },
                  nextPage: 'page2',
                },
              ],
            },
            mockFormDefinition.app.pages[1],
          ],
        },
      };

      const result = getPagesReferencing(formWithBranches, 'page2');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('page1');
    });

    it('should return empty array for page with no references', () => {
      const result = getPagesReferencing(mockFormDefinition, 'page1');

      expect(result).toHaveLength(0);
    });
  });
});
