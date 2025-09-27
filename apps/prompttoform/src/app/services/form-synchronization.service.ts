import { FormDefinition } from '@devhelpr/react-forms';
import { Node, Edge } from '@xyflow/react';

export type SyncSource = 'flow' | 'json' | 'prompt' | 'import';
export type SyncStatus = 'synced' | 'conflict' | 'pending' | 'error';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FormConflict {
  id: string;
  type: 'page_content' | 'page_connections' | 'form_structure';
  jsonVersion: FormDefinition;
  flowVersion: FormDefinition;
  conflictingFields: string[];
  timestamp: Date;
}

export interface ConflictResolution {
  strategy: 'use_json' | 'use_flow' | 'merge' | 'manual';
  resolvedForm: FormDefinition;
  description: string;
}

export interface FormChange {
  id: string;
  timestamp: Date;
  type:
    | 'node_update'
    | 'edge_update'
    | 'page_add'
    | 'page_remove'
    | 'json_edit'
    | 'form_structure_change';
  source: SyncSource;
  before: FormDefinition;
  after: FormDefinition;
  description: string;
  nodeId?: string;
  edgeId?: string;
}

export class FormSynchronizationService {
  private subscribers: Array<(formDefinition: FormDefinition) => void> = [];
  private changeHistory: FormChange[] = [];
  private conflicts: FormConflict[] = [];
  private maxHistorySize = 50;

  /**
   * Subscribe to form changes from any source
   */
  subscribeToFormChanges(
    callback: (formDefinition: FormDefinition) => void
  ): () => void {
    this.subscribers.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers of form changes
   */
  private notifySubscribers(formDefinition: FormDefinition): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(formDefinition);
      } catch (error) {
        console.error('Error in form change subscriber:', error);
      }
    });
  }

  /**
   * Update form from flow editor changes
   */
  updateFromFlow(
    nodes: Node[],
    edges: Edge[],
    originalForm: FormDefinition
  ): FormDefinition {
    try {
      const updatedForm = this.generateFormFromFlow(nodes, edges, originalForm);
      this.trackChange({
        id: this.generateChangeId(),
        timestamp: new Date(),
        type: 'form_structure_change',
        source: 'flow',
        before: originalForm,
        after: updatedForm,
        description: 'Form updated from flow editor',
      });

      this.notifySubscribers(updatedForm);
      return updatedForm;
    } catch (error) {
      console.error('Error updating form from flow:', error);
      throw new Error('Failed to update form from flow editor');
    }
  }

  /**
   * Update form from JSON editor changes
   */
  updateFromJson(jsonString: string): FormDefinition | null {
    try {
      const parsedForm = JSON.parse(jsonString) as FormDefinition;

      if (!this.validateFormStructure(parsedForm)) {
        throw new Error('Invalid form structure');
      }

      this.trackChange({
        id: this.generateChangeId(),
        timestamp: new Date(),
        type: 'json_edit',
        source: 'json',
        before: {} as FormDefinition, // We don't have the previous state here
        after: parsedForm,
        description: 'Form updated from JSON editor',
      });

      this.notifySubscribers(parsedForm);
      return parsedForm;
    } catch (error) {
      console.error('Error updating form from JSON:', error);
      return null;
    }
  }

  /**
   * Validate form consistency
   */
  validateFormConsistency(formDefinition: FormDefinition): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
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
  }

  /**
   * Handle conflicts between different editing modes
   */
  resolveConflicts(
    flowForm: FormDefinition,
    jsonForm: FormDefinition
  ): FormDefinition {
    const conflict = this.detectConflict(flowForm, jsonForm);

    if (conflict) {
      this.conflicts.push(conflict);

      // For now, use a simple strategy: prefer the most recent change
      // In a real implementation, this would show a conflict resolution dialog
      const resolution: ConflictResolution = {
        strategy: 'use_flow', // Default to flow version
        resolvedForm: flowForm,
        description: 'Auto-resolved conflict by preferring flow version',
      };

      return resolution.resolvedForm;
    }

    return flowForm; // No conflict detected
  }

  /**
   * Detect conflicts between two form versions
   */
  private detectConflict(
    flowForm: FormDefinition,
    jsonForm: FormDefinition
  ): FormConflict | null {
    const conflictingFields: string[] = [];

    // Check for structural differences
    if (flowForm.app.pages.length !== jsonForm.app.pages.length) {
      conflictingFields.push('page_count');
    }

    // Check for page content differences
    flowForm.app.pages.forEach((flowPage, index) => {
      const jsonPage = jsonForm.app.pages[index];
      if (!jsonPage) {
        conflictingFields.push(`page_${index}_missing`);
        return;
      }

      if (flowPage.title !== jsonPage.title) {
        conflictingFields.push(`page_${index}_title`);
      }

      if (
        JSON.stringify(flowPage.components) !==
        JSON.stringify(jsonPage.components)
      ) {
        conflictingFields.push(`page_${index}_components`);
      }

      if (flowPage.nextPage !== jsonPage.nextPage) {
        conflictingFields.push(`page_${index}_nextPage`);
      }

      if (
        JSON.stringify(flowPage.branches) !== JSON.stringify(jsonPage.branches)
      ) {
        conflictingFields.push(`page_${index}_branches`);
      }
    });

    if (conflictingFields.length > 0) {
      return {
        id: this.generateChangeId(),
        type: 'form_structure',
        jsonVersion: jsonForm,
        flowVersion: flowForm,
        conflictingFields,
        timestamp: new Date(),
      };
    }

    return null;
  }

  /**
   * Generate form definition from flow nodes and edges
   */
  private generateFormFromFlow(
    nodes: Node[],
    edges: Edge[],
    originalForm: FormDefinition
  ): FormDefinition {
    const pages = nodes.map((node) => node.data?.page).filter(Boolean);

    // Filter out the thank you page from regular pages
    const regularPages = pages.filter((page) => page.id !== 'thank-you-page');

    // Create a map of source nodes to their outgoing edges
    const nodeEdges = new Map<string, Edge[]>();
    edges.forEach((edge) => {
      if (!nodeEdges.has(edge.source)) {
        nodeEdges.set(edge.source, []);
      }
      nodeEdges.get(edge.source)!.push(edge);
    });

    // Update pages with edge information
    const updatedPages = regularPages.map((page) => {
      const pageEdges = nodeEdges.get(page.id) || [];

      if (pageEdges.length === 0) {
        // No edges - remove nextPage and branches
        return {
          id: page.id,
          title: page.title,
          route: page.route,
          layout: page.layout,
          components: page.components,
          ...(page.isEndPage && { isEndPage: page.isEndPage }),
        };
      } else if (pageEdges.length === 1) {
        // Single edge - set nextPage
        return {
          id: page.id,
          title: page.title,
          route: page.route,
          layout: page.layout,
          components: page.components,
          nextPage: pageEdges[0].target,
          ...(page.isEndPage && { isEndPage: page.isEndPage }),
        };
      } else {
        // Multiple edges - set branches
        const existingBranches = page.branches || [];
        const branches = pageEdges.map((edge, index) => {
          // Try to match edges to existing branches using edge labels
          if (edge.label) {
            const edgeLabel = String(edge.label);
            const matchingBranch = existingBranches.find((branch) => {
              const expectedLabel = `${branch.condition.field} ${branch.condition.operator} ${branch.condition.value}`;
              return edgeLabel === expectedLabel;
            });

            if (matchingBranch) {
              return {
                ...matchingBranch,
                nextPage: edge.target,
              };
            }
          }

          // Try to find matching original branch by target
          const originalBranch = existingBranches.find(
            (branch) => branch.nextPage === edge.target
          );

          if (originalBranch) {
            return originalBranch;
          }

          // Fallback to generated condition
          return {
            condition: {
              field: `condition_${index + 1}`,
              operator: '==',
              value: `value_${index + 1}`,
            },
            nextPage: edge.target,
          };
        });

        return {
          id: page.id,
          title: page.title,
          route: page.route,
          layout: page.layout,
          components: page.components,
          branches,
          ...(page.isEndPage && { isEndPage: page.isEndPage }),
        };
      }
    });

    // Check if there's a thank you page in the original form definition
    const hasThankYouPage = originalForm.app.thankYouPage;

    const result: FormDefinition = {
      app: {
        title: originalForm.app.title,
        pages: updatedPages,
        ...(hasThankYouPage && { thankYouPage: originalForm.app.thankYouPage }),
      },
    };

    return result;
  }

  /**
   * Validate basic form structure
   */
  private validateFormStructure(formDefinition: FormDefinition): boolean {
    return !!(
      formDefinition &&
      formDefinition.app &&
      formDefinition.app.title &&
      Array.isArray(formDefinition.app.pages) &&
      formDefinition.app.pages.length > 0
    );
  }

  /**
   * Track form changes for history and undo/redo
   */
  private trackChange(change: FormChange): void {
    this.changeHistory.push(change);

    // Limit history size
    if (this.changeHistory.length > this.maxHistorySize) {
      this.changeHistory.shift();
    }
  }

  /**
   * Get change history
   */
  getChangeHistory(): FormChange[] {
    return [...this.changeHistory];
  }

  /**
   * Get active conflicts
   */
  getActiveConflicts(): FormConflict[] {
    return [...this.conflicts];
  }

  /**
   * Clear resolved conflicts
   */
  clearConflict(conflictId: string): void {
    this.conflicts = this.conflicts.filter((c) => c.id !== conflictId);
  }

  /**
   * Generate unique change ID
   */
  private generateChangeId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
