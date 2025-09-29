import { PageProps } from '@devhelpr/react-forms';

/**
 * Inserts a new page into the form definition at the correct logical position
 * based on the flow structure, rather than simply appending it to the end.
 *
 * This ensures that the page order in the array matches the logical flow order,
 * making the form renderer's indexing more intuitive.
 */
export function insertPageInLogicalOrder(
  pages: PageProps[],
  newPage: PageProps,
  insertAfterPageId?: string
): PageProps[] {
  // If no insert position is specified, append to the end
  if (!insertAfterPageId) {
    return [...pages, newPage];
  }

  // Find the index of the page to insert after
  const insertIndex = pages.findIndex((page) => page.id === insertAfterPageId);

  // If the page to insert after is not found, append to the end
  if (insertIndex === -1) {
    return [...pages, newPage];
  }

  // Insert the new page after the specified page
  const newPages = [...pages];
  newPages.splice(insertIndex + 1, 0, newPage);

  return newPages;
}

/**
 * Reorders pages in the form definition to match the logical flow order.
 * This ensures that the array index corresponds to the logical step order.
 */
export function reorderPagesByLogicalFlow(pages: PageProps[]): PageProps[] {
  if (pages.length <= 1) {
    return pages;
  }

  // Create a map for quick page lookup
  const pageMap = new Map<string, PageProps>();
  pages.forEach((page) => {
    pageMap.set(page.id, page);
  });

  // Build dependency graph
  const dependencies = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  pages.forEach((page) => {
    dependencies.set(page.id, []);
    inDegree.set(page.id, 0);
  });

  // Calculate dependencies and in-degrees
  pages.forEach((page) => {
    // Add nextPage as dependency
    if (page.nextPage && pageMap.has(page.nextPage)) {
      dependencies.get(page.id)!.push(page.nextPage);
      inDegree.set(page.nextPage, (inDegree.get(page.nextPage) || 0) + 1);
    }

    // Add branch destinations as dependencies
    if (page.branches) {
      page.branches.forEach((branch) => {
        if (pageMap.has(branch.nextPage)) {
          dependencies.get(page.id)!.push(branch.nextPage);
          inDegree.set(
            branch.nextPage,
            (inDegree.get(branch.nextPage) || 0) + 1
          );
        }
      });
    }
  });

  // Topological sort to get logical order
  const queue: string[] = [];
  const visited = new Set<string>();
  const logicalOrder: PageProps[] = [];

  // Start with root nodes (no incoming edges)
  pages.forEach((page) => {
    if (inDegree.get(page.id) === 0) {
      queue.push(page.id);
    }
  });

  // Process queue
  while (queue.length > 0) {
    const currentPageId = queue.shift()!;

    if (visited.has(currentPageId)) {
      continue;
    }

    visited.add(currentPageId);
    const page = pageMap.get(currentPageId)!;
    logicalOrder.push(page);

    // Process dependencies
    const deps = dependencies.get(currentPageId) || [];
    deps.forEach((depId) => {
      const currentInDegree = inDegree.get(depId) || 0;
      inDegree.set(depId, currentInDegree - 1);

      if (inDegree.get(depId) === 0 && !visited.has(depId)) {
        queue.push(depId);
      }
    });
  }

  // Handle any remaining pages that weren't connected (orphaned pages)
  pages.forEach((page) => {
    if (!visited.has(page.id)) {
      logicalOrder.push(page);
    }
  });

  return logicalOrder;
}

/**
 * Determines the best position to insert a new page based on the current flow structure.
 * This helps maintain logical ordering when adding new nodes.
 */
export function findBestInsertPosition(
  pages: PageProps[],
  newPage: PageProps,
  selectedNodeId?: string
): { insertAfterPageId?: string; reason: string } {
  // If a specific node is selected, insert after it
  if (selectedNodeId) {
    const selectedPage = pages.find((page) => page.id === selectedNodeId);
    if (selectedPage) {
      return {
        insertAfterPageId: selectedPage.id,
        reason: `Inserting after selected page: ${selectedPage.title}`,
      };
    }
  }

  // If the new page has a nextPage reference, try to insert it before that page
  if (newPage.nextPage) {
    const targetPage = pages.find((page) => page.id === newPage.nextPage);
    if (targetPage) {
      // Find the page that currently points to the target page
      const sourcePage = pages.find(
        (page) =>
          page.nextPage === newPage.nextPage ||
          page.branches?.some((branch) => branch.nextPage === newPage.nextPage)
      );

      if (sourcePage) {
        return {
          insertAfterPageId: sourcePage.id,
          reason: `Inserting after source page to maintain flow to ${targetPage.title}`,
        };
      }
    }
  }

  // If the new page is referenced by other pages, insert it before the first referencing page
  const referencingPages = pages.filter(
    (page) =>
      page.nextPage === newPage.id ||
      page.branches?.some((branch) => branch.nextPage === newPage.id)
  );

  if (referencingPages.length > 0) {
    // Find the earliest position where this page is referenced
    const earliestReferencingPage = referencingPages.reduce(
      (earliest, current) => {
        const earliestIndex = pages.findIndex((p) => p.id === earliest.id);
        const currentIndex = pages.findIndex((p) => p.id === current.id);
        return currentIndex < earliestIndex ? current : earliest;
      }
    );

    const insertIndex = pages.findIndex(
      (p) => p.id === earliestReferencingPage.id
    );
    if (insertIndex > 0) {
      return {
        insertAfterPageId: pages[insertIndex - 1].id,
        reason: `Inserting before first referencing page: ${earliestReferencingPage.title}`,
      };
    }
  }

  // Default: append to the end
  return {
    reason: 'Appending to end as no specific position could be determined',
  };
}
