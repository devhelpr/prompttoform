import { FormDefinition, PageProps } from '../interfaces/form-interfaces';

export interface LogicalPageOrder {
  pageId: string;
  logicalIndex: number;
  page: PageProps;
}

/**
 * Calculates the logical order of pages based on the flow structure
 * rather than their position in the pages array.
 *
 * This uses a topological sort to determine the correct sequence
 * based on nextPage and branches relationships.
 */
export function calculateLogicalPageOrder(
  formDefinition: FormDefinition
): LogicalPageOrder[] {
  const pages = formDefinition.app.pages;
  if (!pages || pages.length === 0) {
    return [];
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
  const logicalOrder: LogicalPageOrder[] = [];
  let logicalIndex = 0;

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

    logicalOrder.push({
      pageId: currentPageId,
      logicalIndex,
      page,
    });
    logicalIndex++;

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
      logicalOrder.push({
        pageId: page.id,
        logicalIndex,
        page,
      });
      logicalIndex++;
    }
  });

  return logicalOrder;
}

/**
 * Gets the logical index of a page by its ID
 */
export function getLogicalPageIndex(
  pageId: string,
  logicalOrder: LogicalPageOrder[]
): number {
  const order = logicalOrder.find((item) => item.pageId === pageId);
  return order ? order.logicalIndex : -1;
}

/**
 * Gets the total number of logical pages
 */
export function getLogicalPageCount(logicalOrder: LogicalPageOrder[]): number {
  return logicalOrder.length;
}

/**
 * Gets the logical page order for a specific page ID
 */
export function getLogicalPageOrder(
  pageId: string,
  logicalOrder: LogicalPageOrder[]
): LogicalPageOrder | undefined {
  return logicalOrder.find((item) => item.pageId === pageId);
}

/**
 * Determines if a page is the first page in the logical flow
 */
export function isFirstLogicalPage(
  pageId: string,
  logicalOrder: LogicalPageOrder[]
): boolean {
  return logicalOrder.length > 0 && logicalOrder[0].pageId === pageId;
}

/**
 * Determines if a page is the last page in the logical flow
 */
export function isLastLogicalPage(
  pageId: string,
  logicalOrder: LogicalPageOrder[]
): boolean {
  return (
    logicalOrder.length > 0 &&
    logicalOrder[logicalOrder.length - 1].pageId === pageId
  );
}
