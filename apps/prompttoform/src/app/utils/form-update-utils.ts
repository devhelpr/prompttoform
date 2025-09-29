import { FormDefinition, PageProps } from '@devhelpr/react-forms';
import { Node, Edge } from '@xyflow/react';

/**
 * Update specific page in form definition
 */
export const updateFormDefinition = (
  formDefinition: FormDefinition,
  nodeId: string,
  pageData: Omit<PageProps, 'id'>
): FormDefinition => {
  const updatedPages = formDefinition.app.pages.map((page) =>
    page.id === nodeId ? { ...page, ...pageData } : page
  );

  return {
    ...formDefinition,
    app: {
      ...formDefinition.app,
      pages: updatedPages,
    },
  };
};

/**
 * Update form connections based on edges
 */
export const updateFormConnections = (
  formDefinition: FormDefinition,
  edges: Edge[]
): FormDefinition => {
  const updatedPages = formDefinition.app.pages.map((page) => {
    const pageEdges = edges.filter((edge) => edge.source === page.id);

    if (pageEdges.length === 0) {
      // No edges - remove nextPage and branches
      return {
        ...page,
        nextPage: undefined,
        branches: undefined,
      };
    } else if (pageEdges.length === 1) {
      // Single edge - set nextPage
      return {
        ...page,
        nextPage: pageEdges[0].target,
        branches: undefined,
      };
    } else {
      // Multiple edges - convert to branches
      const branches = pageEdges.map((edge, index) => ({
        condition: extractConditionFromEdge(edge, index),
        nextPage: edge.target,
      }));
      return {
        ...page,
        nextPage: undefined,
        branches,
      };
    }
  });

  return {
    ...formDefinition,
    app: {
      ...formDefinition.app,
      pages: updatedPages,
    },
  };
};

/**
 * Extract condition from edge label or generate default
 */
const extractConditionFromEdge = (edge: Edge, index: number) => {
  if (edge.label) {
    // Try to parse existing condition from label
    const label = String(edge.label);
    const parts = label.split(' ');

    if (parts.length >= 3) {
      return {
        field: parts[0],
        operator: parts[1],
        value: parts.slice(2).join(' '),
      };
    }
  }

  // Generate default condition
  return {
    field: `condition_${index + 1}`,
    operator: '==',
    value: `value_${index + 1}`,
  };
};

/**
 * Add new page to form definition
 */
export const addPageToForm = (
  formDefinition: FormDefinition,
  newPage: PageProps
): FormDefinition => {
  return {
    ...formDefinition,
    app: {
      ...formDefinition.app,
      pages: [...formDefinition.app.pages, newPage],
    },
  };
};

/**
 * Remove page from form definition
 */
export const removePageFromForm = (
  formDefinition: FormDefinition,
  pageId: string
): FormDefinition => {
  const updatedPages = formDefinition.app.pages.filter(
    (page) => page.id !== pageId
  );

  // Also remove any references to this page in other pages
  const cleanedPages = updatedPages.map((page) => {
    const updatedPage = { ...page };

    // Remove nextPage reference if it points to the deleted page
    if (updatedPage.nextPage === pageId) {
      updatedPage.nextPage = undefined;
    }

    // Remove branch references if they point to the deleted page
    if (updatedPage.branches) {
      updatedPage.branches = updatedPage.branches.filter(
        (branch) => branch.nextPage !== pageId
      );

      // If no branches left, remove the branches property
      if (updatedPage.branches.length === 0) {
        delete updatedPage.branches;
      }
    }

    return updatedPage;
  });

  return {
    ...formDefinition,
    app: {
      ...formDefinition.app,
      pages: cleanedPages,
    },
  };
};

/**
 * Update page components
 */
export const updatePageComponents = (
  formDefinition: FormDefinition,
  pageId: string,
  components: PageProps['components']
): FormDefinition => {
  const updatedPages = formDefinition.app.pages.map((page) =>
    page.id === pageId ? { ...page, components } : page
  );

  return {
    ...formDefinition,
    app: {
      ...formDefinition.app,
      pages: updatedPages,
    },
  };
};

/**
 * Update page title
 */
export const updatePageTitle = (
  formDefinition: FormDefinition,
  pageId: string,
  title: string
): FormDefinition => {
  const updatedPages = formDefinition.app.pages.map((page) =>
    page.id === pageId ? { ...page, title } : page
  );

  return {
    ...formDefinition,
    app: {
      ...formDefinition.app,
      pages: updatedPages,
    },
  };
};

/**
 * Update page route
 */
export const updatePageRoute = (
  formDefinition: FormDefinition,
  pageId: string,
  route: string
): FormDefinition => {
  const updatedPages = formDefinition.app.pages.map((page) =>
    page.id === pageId ? { ...page, route } : page
  );

  return {
    ...formDefinition,
    app: {
      ...formDefinition.app,
      pages: updatedPages,
    },
  };
};

/**
 * Update page layout
 */
export const updatePageLayout = (
  formDefinition: FormDefinition,
  pageId: string,
  layout: string
): FormDefinition => {
  const updatedPages = formDefinition.app.pages.map((page) =>
    page.id === pageId ? { ...page, layout } : page
  );

  return {
    ...formDefinition,
    app: {
      ...formDefinition.app,
      pages: updatedPages,
    },
  };
};

/**
 * Update page end status
 */
export const updatePageEndStatus = (
  formDefinition: FormDefinition,
  pageId: string,
  isEndPage: boolean
): FormDefinition => {
  const updatedPages = formDefinition.app.pages.map((page) =>
    page.id === pageId ? { ...page, isEndPage } : page
  );

  return {
    ...formDefinition,
    app: {
      ...formDefinition.app,
      pages: updatedPages,
    },
  };
};

/**
 * Update form title
 */
export const updateFormTitle = (
  formDefinition: FormDefinition,
  title: string
): FormDefinition => {
  return {
    ...formDefinition,
    app: {
      ...formDefinition.app,
      title,
    },
  };
};

/**
 * Update thank you page configuration
 */
export const updateThankYouPage = (
  formDefinition: FormDefinition,
  thankYouPage: FormDefinition['app']['thankYouPage']
): FormDefinition => {
  return {
    ...formDefinition,
    app: {
      ...formDefinition.app,
      thankYouPage,
    },
  };
};

/**
 * Validate form structure
 */
export const validateFormStructure = (
  formDefinition: FormDefinition
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check basic structure
  if (!formDefinition.app) {
    errors.push('Form must have an app property');
    return { isValid: false, errors, warnings };
  }

  if (!formDefinition.app.title) {
    errors.push('Form must have a title');
  }

  if (!formDefinition.app.pages || !Array.isArray(formDefinition.app.pages)) {
    errors.push('Form must have pages array');
    return { isValid: false, errors, warnings };
  }

  if (formDefinition.app.pages.length === 0) {
    errors.push('Form must have at least one page');
  }

  // First pass: collect all page IDs and validate basic page structure
  const pageIds = new Set<string>();
  formDefinition.app.pages.forEach((page, index) => {
    if (!page.id) {
      errors.push(`Page ${index} must have an id`);
    } else {
      if (pageIds.has(page.id)) {
        errors.push(`Duplicate page id: ${page.id}`);
      }
      pageIds.add(page.id);
    }

    if (!page.title) {
      errors.push(`Page ${index} must have a title`);
    }

    if (!page.route) {
      errors.push(`Page ${index} must have a route`);
    }

    if (!page.components || !Array.isArray(page.components)) {
      errors.push(`Page ${index} must have components array`);
    } else if (page.components.length === 0) {
      warnings.push(`Page ${index} has no components`);
    }
  });

  // Second pass: validate page connections (after all page IDs are collected)
  formDefinition.app.pages.forEach((page, index) => {
    // Validate page connections
    if (page.nextPage && !pageIds.has(page.nextPage)) {
      errors.push(
        `Page ${index} references non-existent nextPage: ${page.nextPage}`
      );
    }

    if (page.branches) {
      page.branches.forEach((branch, branchIndex) => {
        if (!branch.condition) {
          errors.push(
            `Page ${index} branch ${branchIndex} must have a condition`
          );
        } else {
          if (!branch.condition.field) {
            errors.push(
              `Page ${index} branch ${branchIndex} condition must have a field`
            );
          }
          if (!branch.condition.operator) {
            errors.push(
              `Page ${index} branch ${branchIndex} condition must have an operator`
            );
          }
        }

        if (!branch.nextPage) {
          errors.push(
            `Page ${index} branch ${branchIndex} must have a nextPage`
          );
        } else if (!pageIds.has(branch.nextPage)) {
          errors.push(
            `Page ${index} branch ${branchIndex} references non-existent nextPage: ${branch.nextPage}`
          );
        }
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Get page by ID
 */
export const getPageById = (
  formDefinition: FormDefinition,
  pageId: string
): PageProps | undefined => {
  return formDefinition.app.pages.find((page) => page.id === pageId);
};

/**
 * Get all page IDs
 */
export const getAllPageIds = (formDefinition: FormDefinition): string[] => {
  return formDefinition.app.pages.map((page) => page.id);
};

/**
 * Check if page exists
 */
export const pageExists = (
  formDefinition: FormDefinition,
  pageId: string
): boolean => {
  return formDefinition.app.pages.some((page) => page.id === pageId);
};

/**
 * Get pages that reference a specific page
 */
export const getPagesReferencing = (
  formDefinition: FormDefinition,
  targetPageId: string
): PageProps[] => {
  return formDefinition.app.pages.filter((page) => {
    // Check nextPage reference
    if (page.nextPage === targetPageId) {
      return true;
    }

    // Check branch references
    if (page.branches) {
      return page.branches.some((branch) => branch.nextPage === targetPageId);
    }

    return false;
  });
};
