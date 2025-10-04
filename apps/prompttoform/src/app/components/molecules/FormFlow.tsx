import React, { useCallback, useState, useMemo, useRef } from 'react';
import {
  ReactFlow,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  Position,
  useNodesState,
  applyEdgeChanges,
  applyNodeChanges,
  Controls,
  Background,
  addEdge,
  reconnectEdge,
} from '@xyflow/react';

import { NodeTooltip, NodeTooltipContent } from '../flow/node-tooltip';
import { BaseNode, BaseNodeContent } from '../flow/base-node';
import {
  FormRenderer,
  PageProps,
  type FormDefinition as LibraryFormDefinition,
} from '@devhelpr/react-forms';
import { LabeledHandle } from '../flow/labeled-handle';
import { FormPreviewSidebar } from '../flow/form-preview-sidebar';
import { NodeEditorSidebar } from '../flow/node-editor-sidebar';
import { CreateNodeModal } from '../flow/create-node-modal';
import { Monitor, Download, Plus } from 'lucide-react';
import {
  insertPageInLogicalOrder,
  reorderPagesByLogicalFlow,
  findBestInsertPosition,
} from '../../utils/flow-ordering';

import '@xyflow/react/dist/style.css';

// Debounce utility function
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Define the thank you page action type
interface ThankYouPageAction {
  label: string;
  action: string;
  customAction?: string;
  className?: string;
}

// Define the thank you page configuration type
interface ThankYouPageConfig {
  title: string;
  message: string;
  showRestartButton?: boolean;
  customActions?: ThankYouPageAction[];
}

// Mobile warning component
function MobileWarning() {
  return (
    <div className="fixed inset-0 bg-gray-400 bg-opacity-95 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 max-w-md mx-auto text-center shadow-2xl">
        <div className="flex justify-center mb-4">
          <Monitor className="w-16 h-16 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Desktop Only</h2>
        <p className="text-gray-600 mb-6">
          This application is designed for desktop use only. The form flow
          editor requires a larger screen to provide the best experience.
        </p>
        <p className="text-sm text-gray-500">
          Please open this application on a desktop or laptop computer with a
          screen width of at least 1024px.
        </p>
      </div>
    </div>
  );
}

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Check on mount
    checkIsMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}

// Create a form definition for a single page
const createPageFormDefinition = (page: PageProps) => ({
  app: {
    title: page.title,
    pages: [page],
  },
});

function Tooltip({ data }: { data: { page: PageProps; version?: number } }) {
  const pageFormDefinition = createPageFormDefinition(data.page);

  const branchInfo = data.page.branches
    ? data.page.branches
        .map(
          (branch) =>
            `${branch.condition.field} ${branch.condition.operator} ${branch.condition.value} → ${branch.nextPage}`
        )
        .join(', ')
    : data.page.nextPage
    ? `Next: ${data.page.nextPage}`
    : data.page.isEndPage
    ? 'End Page'
    : 'No next page';

  // Check if this is an end node or thank you page
  const isEndNode = data.page.isEndPage || data.page.id === 'thank-you-page';

  return (
    <div className="">
      <NodeTooltip>
        <NodeTooltipContent position={Position.Top}>
          <div className="text-sm">
            <div className="font-semibold">{data.page.title}</div>
            <div className="text-xs text-gray-300">{branchInfo}</div>
          </div>
        </NodeTooltipContent>
        <BaseNode>
          {/* Header with different color for end nodes */}
          <div
            className={`px-3 py-2 font-semibold text-white ${
              isEndNode
                ? 'bg-green-600' // Green for end nodes/thank you pages
                : 'bg-blue-600' // Blue for regular pages
            }`}
          >
            {data.page.title}
          </div>
          <BaseNodeContent>
            <div className="nodrag nopan nowheel pointer-events-none w-[300px] h-[400px] overflow-auto">
              <FormRenderer
                formJson={pageFormDefinition}
                prefixId="flow"
                disabled={true}
              />
            </div>
          </BaseNodeContent>
          <footer className="bg-gray-100 flex justify-between">
            <LabeledHandle
              key={`${data.page.id}-in`}
              title="in"
              id={`${data.page.id}-in`}
              type="target"
              position={Position.Left}
              isConnectable={true}
            />
            <LabeledHandle
              key={`${data.page.id}-out-${isEndNode}-${data.version || 0}`}
              title="out"
              id={`${data.page.id}-out`}
              type="source"
              position={Position.Right}
              isConnectable={!isEndNode}
              style={{
                opacity: isEndNode ? 0.3 : 1,
                pointerEvents: isEndNode ? 'none' : 'auto',
              }}
              onConnect={(params) => console.log('Connect params:', params)}
            />
          </footer>
        </BaseNode>
      </NodeTooltip>
    </div>
  );
}

const nodeTypes = {
  tooltip: Tooltip,
};

// Generate nodes and edges from form definition
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateFlowFromFormDefinition = (formDef: LibraryFormDefinition) => {
  const pages = formDef.app.pages as PageProps[];
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Check if form has a thank you page
  const hasThankYouPage = formDef.app.thankYouPage;

  // Calculate layout positions with better spacing
  const horizontalSpacing = 600; // Increased from 400
  const nodeWidth = 350; // Approximate node width
  const nodeHeight = 500; // Approximate node height

  // Create a map to track node positions and build a dependency graph
  const nodePositions = new Map<string, { x: number; y: number }>();
  const nodeDependencies = new Map<string, string[]>();
  const nodeLevels = new Map<string, number>();

  // First pass: build dependency graph and assign levels
  pages.forEach((page) => {
    const dependencies: string[] = [];

    // Add all branch destinations
    if (page.branches) {
      page.branches.forEach((branch) => {
        dependencies.push(branch.nextPage);
      });
    }

    // Add nextPage if it exists (this is the "else" case)
    if (page.nextPage) {
      dependencies.push(page.nextPage);
    }

    nodeDependencies.set(page.id, dependencies);
  });

  // Calculate levels using topological sort to ensure proper chain ordering
  const inDegree = new Map<string, number>();
  const visited = new Set<string>();
  const queue: Array<{ id: string; level: number }> = [];

  // Initialize in-degree counts
  pages.forEach((page) => {
    inDegree.set(page.id, 0);
  });

  // Calculate in-degrees (number of incoming edges)
  pages.forEach((page) => {
    // Add all branch destinations as having incoming edges
    if (page.branches) {
      page.branches.forEach((branch) => {
        const currentInDegree = inDegree.get(branch.nextPage) || 0;
        inDegree.set(branch.nextPage, currentInDegree + 1);
      });
    }

    // Add nextPage as having incoming edges (this is the "else" case)
    if (page.nextPage) {
      const currentInDegree = inDegree.get(page.nextPage) || 0;
      inDegree.set(page.nextPage, currentInDegree + 1);
    }
  });

  // Start with root nodes (nodes with no incoming edges)
  pages.forEach((page) => {
    if (inDegree.get(page.id) === 0) {
      queue.push({ id: page.id, level: 0 });
      nodeLevels.set(page.id, 0);
    }
  });

  // Process queue using topological sort
  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const dependencies = nodeDependencies.get(id) || [];
    dependencies.forEach((depId) => {
      // Decrease in-degree for this dependency
      const currentInDegree = inDegree.get(depId) || 0;
      inDegree.set(depId, currentInDegree - 1);

      // Set level to be exactly one higher than the current node
      const newLevel = level + 1;
      const currentLevel = nodeLevels.get(depId) || 0;

      // Always use the maximum level to handle cases where a node has multiple incoming edges
      const finalLevel = Math.max(currentLevel, newLevel);
      nodeLevels.set(depId, finalLevel);

      // Add to queue if in-degree becomes 0 (all dependencies processed)
      if (inDegree.get(depId) === 0 && !visited.has(depId)) {
        queue.push({ id: depId, level: finalLevel });
      }
    });
  }

  // Find the highest level for positioning the thank you page
  let maxLevel = 0;
  pages.forEach((page) => {
    const level = nodeLevels.get(page.id) || 0;
    maxLevel = Math.max(maxLevel, level);
  });

  // If there's a thank you page, add it at the highest level + 1
  if (hasThankYouPage) {
    const thankYouPageId = 'thank-you-page';
    nodeLevels.set(thankYouPageId, maxLevel + 1);
  }

  // Second pass: position nodes based on levels with better spacing
  const levelGroups = new Map<number, string[]>();
  pages.forEach((page) => {
    const level = nodeLevels.get(page.id) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(page.id);
  });

  // Add thank you page to level groups if it exists
  if (hasThankYouPage) {
    const thankYouPageId = 'thank-you-page';
    const thankYouLevel = nodeLevels.get(thankYouPageId) || 0;
    if (!levelGroups.has(thankYouLevel)) {
      levelGroups.set(thankYouLevel, []);
    }
    levelGroups.get(thankYouLevel)!.push(thankYouPageId);
  }

  // Position nodes with improved spacing and flow consideration
  levelGroups.forEach((nodeIds, level) => {
    const levelWidth = nodeIds.length * (nodeWidth + 100); // Extra spacing between nodes in same level
    const startX = level * horizontalSpacing;
    const startY = -(levelWidth / 2) + nodeWidth / 2;

    // Sort nodes within each level to improve flow visualization
    const sortedNodeIds = [...nodeIds].sort((a, b) => {
      // Try to position nodes that are "else" cases (nextPage) after branch nodes
      const pageA = pages.find((p) => p.id === a);
      const pageB = pages.find((p) => p.id === b);

      if (pageA && pageB) {
        // If one has branches and the other doesn't, prioritize the one with branches
        const aHasBranches = pageA.branches && pageA.branches.length > 0;
        const bHasBranches = pageB.branches && pageB.branches.length > 0;

        if (aHasBranches && !bHasBranches) return -1;
        if (!aHasBranches && bHasBranches) return 1;
      }

      return 0;
    });

    sortedNodeIds.forEach((nodeId, index) => {
      const x = startX;
      const y = startY + index * (nodeHeight + 100); // Extra vertical spacing
      nodePositions.set(nodeId, { x, y });
    });
  });

  // Create nodes
  pages.forEach((page) => {
    const position = nodePositions.get(page.id) || { x: 0, y: 0 };

    nodes.push({
      id: page.id,
      position,
      data: { page },
      type: 'tooltip',
    });
  });

  // Create thank you page node if it exists
  if (hasThankYouPage) {
    const thankYouPageId = 'thank-you-page';
    const position = nodePositions.get(thankYouPageId) || { x: 0, y: 0 };

    // Create a thank you page object
    const thankYouPage = {
      id: thankYouPageId,
      title: formDef.app.thankYouPage?.title || 'Thank You',
      route: '/thank-you',
      layout: 'vertical',
      components: [
        {
          id: 'thank-you-message',
          type: 'text',
          props: {
            content:
              formDef.app.thankYouPage?.message ||
              'Thank you for your submission!',
          },
        },
        ...(formDef.app.thankYouPage?.showRestartButton
          ? [
              {
                id: 'restart-button',
                type: 'button',
                label: 'Start Over',
                props: {
                  className: 'primary',
                },
              },
            ]
          : []),
        ...(formDef.app.thankYouPage?.customActions?.map(
          (action: { label: string; className?: string }, index: number) => ({
            id: `custom-action-${index}`,
            type: 'button',
            label: action.label,
            props: {
              className: action.className || 'primary',
            },
          })
        ) || []),
      ],
      isEndPage: true,
    };

    nodes.push({
      id: thankYouPageId,
      position,
      data: { page: thankYouPage },
      type: 'tooltip',
    });
  }

  // Create edges with selection styling
  pages.forEach((page) => {
    // Create edges for branches (if any)
    if (page.branches) {
      page.branches.forEach((branch, branchIndex) => {
        const edgeLabel = `${branch.condition.field} ${branch.condition.operator} ${branch.condition.value}`;

        edges.push({
          id: `${page.id}-branch-${branchIndex}-to-${branch.nextPage}`,
          source: page.id,
          target: branch.nextPage,
          type: 'smoothstep', // Branched edges use smoothstep
          animated: true,
          label: edgeLabel,
          style: {
            stroke: '#ff6b6b',
            strokeWidth: 2,
            cursor: 'pointer',
          },
          selected: false,
          reconnectable: true, // Allow reconnection on both sides
        });
      });
    }

    // Create edge for nextPage (if defined) - this is the "else" case
    if (page.nextPage) {
      edges.push({
        id: `${page.id}-to-${page.nextPage}`,
        source: page.id,
        target: page.nextPage,
        type: 'default', // Direct edges use bezier curves
        animated: true,
        style: {
          stroke: '#4ecdc4',
          strokeWidth: 2,
          cursor: 'pointer',
        },
        selected: false,
        reconnectable: true, // Allow reconnection on both sides
      });
    }

    // If there's a thank you page and this page is an end page (no outgoing edges), connect to thank you page
    if (hasThankYouPage && !page.branches && !page.nextPage) {
      edges.push({
        id: `${page.id}-to-thank-you-page`,
        source: page.id,
        target: 'thank-you-page',
        type: 'default',
        animated: true,
        style: {
          stroke: '#10b981', // Green color for thank you page connections
          strokeWidth: 2,
          cursor: 'pointer',
        },
        selected: false,
        reconnectable: true, // Allow reconnection on both sides
      });
    }
  });

  return { nodes, edges };
};

// Generate complete form definition from flow nodes and edges
const generateCompleteFormDefinition = (nodes: Node[], edges: Edge[]) => {
  const pages = nodes
    .map((node) => node.data?.page)
    .filter(Boolean) as PageProps[];

  // Filter out the thank you page from regular pages (it's handled separately)
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
      // Use the existing branches from the page data if available, otherwise generate new ones
      const existingBranches = page.branches || [];

      // Try to match edges to existing branches using edge labels
      const branches = pageEdges.map((edge, index) => {
        // If the edge has a label, try to find a matching branch by condition
        if (edge.label) {
          const edgeLabel = String(edge.label);
          const matchingBranch = existingBranches.find((branch) => {
            const expectedLabel = `${branch.condition.field} ${branch.condition.operator} ${branch.condition.value}`;
            return edgeLabel === expectedLabel;
          });

          if (matchingBranch) {
            return {
              ...matchingBranch,
              nextPage: edge.target, // Update the target to match the current edge
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
  const hasThankYouPage = nodes.some((node) => node.id === 'thank-you-page');

  // Reorder pages to match logical flow order
  const reorderedPages = reorderPagesByLogicalFlow(updatedPages);

  const result: { app: any } = {
    // TODO infer app tyoe from FormDefinition
    app: {
      title: 'Generated Form',
      pages: reorderedPages,
      ...(hasThankYouPage && { thankYouPage: {} as ThankYouPageConfig }), // Placeholder for thankYouPage
    },
  };

  // If there was a thank you page, we'll need to get the configuration from the current form
  // This will be handled by the calling code that has access to the original form definition
  if (hasThankYouPage) {
    // Note: The thankYouPage configuration should be preserved by the calling code
    // that has access to the original form definition
  }

  return result;
};

function Flow({
  formDefinition,
  onFormChange,
  onConflictDetected,
  readOnly = false,
}: {
  formDefinition: LibraryFormDefinition;
  onFormChange?: (nodes: Node[], edges: Edge[]) => void;
  onConflictDetected?: (conflict: any) => void;
  readOnly?: boolean;
}) {
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [selectedFormIndex, setSelectedFormIndex] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [importedForm, setImportedForm] = useState<any>(null);
  const [importedFormName, setImportedFormName] = useState<string>('');
  const [justImportedForm, setJustImportedForm] = useState(false);

  // Create a list of all available forms (including the default complex form and imported form)
  // const allForms = useMemo(() => {
  //   const defaultForm = {
  //     name: 'Complex Health Form (Default)',
  //     description: 'A complex health form with many branches',
  //     json: formDefinition,
  //   };

  //   const forms = [defaultForm, ...READY_MADE_FORMS];

  //   // Add imported form if it exists
  //   if (importedForm) {
  //     forms.push({
  //       name: importedFormName || 'Imported Form',
  //       description: 'Custom form imported from JSON file',
  //       json: importedForm,
  //     });
  //   }

  //   return forms;
  // }, [importedForm, importedFormName]);

  const currentForm = formDefinition;

  // Auto-select imported form when it's added
  // React.useEffect(() => {
  //   if (importedForm && allForms.length > 0 && justImportedForm) {
  //     const importedFormIndex = allForms.findIndex(
  //       (form) => form.name === (importedFormName || 'Imported Form')
  //     );
  //     if (importedFormIndex !== -1) {
  //       setSelectedFormIndex(importedFormIndex);
  //       setJustImportedForm(false); // Reset the flag after auto-selecting
  //     }
  //   }
  // }, [importedForm, importedFormName, allForms, justImportedForm]);

  // Ensure selectedFormIndex is valid
  // React.useEffect(() => {
  //   if (allForms.length > 0 && selectedFormIndex >= allForms.length) {
  //     setSelectedFormIndex(0);
  //   }
  // }, [allForms.length, selectedFormIndex]);

  // Handle file upload
  // const handleFileUpload = useCallback(
  //   (event: React.ChangeEvent<HTMLInputElement>) => {
  //     const file = event.target.files?.[0];
  //     if (!file) return;

  //     const reader = new FileReader();
  //     reader.onload = (e) => {
  //       try {
  //         const jsonContent = JSON.parse(e.target?.result as string);
  //         setImportedForm(jsonContent);
  //         setImportedFormName(file.name.replace('.json', ''));
  //         setJustImportedForm(true); // Set flag to trigger auto-selection
  //         // The imported form will be automatically selected by the useEffect
  //         // Reset selections when switching forms
  //         setSelectedNode(null);
  //         setSelectedEdge(null);
  //         setNodeEditorOpen(false);
  //         setEdgeEditorOpen(false);
  //         // Reset form preview when importing new form
  //         setSidebarOpen(false);
  //       } catch {
  //         alert('Invalid JSON file. Please check the file format.');
  //       }
  //     };
  //     reader.readAsText(file);

  //     // Reset the input
  //     event.target.value = '';
  //   },
  //   [allForms.length]
  // );

  // Handle removing imported form
  const handleRemoveImportedForm = useCallback(() => {
    setImportedForm(null);
    setImportedFormName('');
    // Reset to default form (index 0)
    setSelectedFormIndex(0);
    // Reset selections when switching forms
    setSelectedNode(null);
    setSelectedEdge(null);
    setNodeEditorOpen(false);
    setEdgeEditorOpen(false);
    // Reset form preview when removing imported form
    setSidebarOpen(false);
  }, []);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => generateFlowFromFormDefinition(currentForm),
    [currentForm]
  );

  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [edgeEditorOpen, setEdgeEditorOpen] = useState(false);
  const [nodeEditorOpen, setNodeEditorOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Ref to track current state for sync
  const currentStateRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [isSelectionChanging, setIsSelectionChanging] = useState(false);
  const [lastSelectedNode, setLastSelectedNode] = useState<string | null>(null);
  const [createNodeModalOpen, setCreateNodeModalOpen] = useState(false);

  // Update nodes and edges when form changes
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } =
      generateFlowFromFormDefinition(currentForm);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [currentForm, setNodes]);

  // Auto-close sidebar when no node or edge is selected
  // But only if the sidebar is currently open and we're not in the middle of a selection change
  React.useEffect(() => {
    console.log('Auto-close effect triggered:', {
      selectedNode,
      selectedEdge,
      nodeEditorOpen,
      edgeEditorOpen,
      isSelectionChanging,
    });

    if (
      !selectedNode &&
      !selectedEdge &&
      (nodeEditorOpen || edgeEditorOpen) &&
      !isSelectionChanging &&
      !lastSelectedNode // Only close if there's no previous selection
    ) {
      console.log('Conditions met for auto-close, setting timeout');
      // Add a longer delay to prevent closing during rapid selection changes
      const timeoutId = setTimeout(() => {
        console.log('Timeout fired, checking conditions again:', {
          selectedNode,
          selectedEdge,
          isSelectionChanging,
        });
        if (
          !selectedNode &&
          !selectedEdge &&
          !isSelectionChanging &&
          !lastSelectedNode
        ) {
          console.log('Auto-closing sidebar');
          setNodeEditorOpen(false);
          setEdgeEditorOpen(false);
          setLastSelectedNode(null); // Clear the last selected node when actually closing
        } else {
          console.log('Conditions changed, not closing sidebar');
        }
      }, 300); // Increased delay to handle rapid selection changes

      return () => {
        console.log('Clearing auto-close timeout');
        clearTimeout(timeoutId);
      };
    }
  }, [
    selectedNode,
    selectedEdge,
    nodeEditorOpen,
    edgeEditorOpen,
    isSelectionChanging,
    lastSelectedNode,
  ]);

  // Reset active page when sidebar is closed
  React.useEffect(() => {
    if (!sidebarOpen && activePageId) {
      setActivePageId(null);
    }
  }, [sidebarOpen, activePageId]);

  // Debug active page changes
  React.useEffect(() => {
    console.log('Active page ID changed:', activePageId);
  }, [activePageId]);

  // Create a stable key for form structure changes
  const formStructureKey = useMemo(() => {
    // Create a hash of the essential form structure data
    const nodeStructure = nodes
      .map((node) => ({
        id: node.id,
        pageId: (node.data as { page: PageProps })?.page?.id,
        pageTitle: (node.data as { page: PageProps })?.page?.title,
        pageContent: (node.data as { page: PageProps })?.page, // Include full page content
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    const edgeStructure = edges
      .map((edge) => ({
        source: edge.source,
        target: edge.target,
      }))
      .sort((a, b) => a.source.localeCompare(b.source));

    return JSON.stringify({
      nodeStructure,
      edgeStructure,
      currentForm: currentForm.app.title,
    });
  }, [nodes, edges, currentForm]);

  // Generate complete form definition from current nodes and edges
  const completeFormDefinition = useMemo(() => {
    const definition = generateCompleteFormDefinition(nodes, edges) as {
      app: any;
    };

    // Preserve thankYouPage configuration from the original form
    if ((currentForm as LibraryFormDefinition).app.thankYouPage) {
      definition.app.thankYouPage = (
        currentForm as LibraryFormDefinition
      ).app.thankYouPage;
    }

    return definition;
  }, [formStructureKey]);

  // Move side effect to useEffect (as recommended in research)
  React.useEffect(() => {
    setLastUpdated(new Date());
  }, [completeFormDefinition]);

  // Create debounced version of onFormChange to prevent rapid-fire updates
  const debouncedOnFormChange = useMemo(
    () => (onFormChange ? debounce(onFormChange, 300) : undefined),
    [onFormChange]
  );

  // Handle exporting form definition as JSON
  const handleExportForm = useCallback(() => {
    const formData = completeFormDefinition;
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentForm.app.title
      .replace(/\s+/g, '-')
      .toLowerCase()}-export.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [completeFormDefinition, currentForm.app.title]);

  // Get selected node details
  const selectedNodeDetails = useMemo(() => {
    if (!selectedNode) return null;

    const node = nodes.find((n) => n.id === selectedNode);
    if (!node) return null;

    return {
      id: node.id,
      page: (node.data as { page: PageProps })?.page,
    };
  }, [selectedNode, nodes]);

  // Get selected edge details and current branch index
  const selectedEdgeDetails = useMemo(() => {
    if (!selectedEdge) return null;

    const edge = edges.find((e) => e.id === selectedEdge);
    if (!edge) return null;

    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    const sourcePage = (sourceNode?.data as { page: PageProps })?.page;

    // Determine current branch index based on edge's current state
    let currentBranchIndex: number | null = null;

    // If edge has a label, it's a branched edge - find the matching branch
    if (edge.label && sourcePage?.branches) {
      const edgeLabel = String(edge.label);
      for (let i = 0; i < sourcePage.branches.length; i++) {
        const branch = sourcePage.branches[i];
        const expectedLabel = `${branch.condition.field} ${branch.condition.operator} ${branch.condition.value}`;

        if (edgeLabel === expectedLabel) {
          currentBranchIndex = i;
          break;
        }
      }
    }
    // If edge has no label, it's a direct connection
    else if (!edge.label) {
      currentBranchIndex = null; // Direct connection
    }

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourcePage: sourcePage || null,
      targetPage: (targetNode?.data as { page: PageProps })?.page || null,
      currentBranchIndex,
    };
  }, [selectedEdge, edges, nodes]);

  // Apply selection styling to edges
  const styledEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      style: {
        ...edge.style,
        strokeWidth: selectedEdge === edge.id ? 6 : 2,
        stroke:
          selectedEdge === edge.id
            ? edge.style?.stroke === '#ff6b6b'
              ? '#ff4757'
              : '#00d2d3'
            : edge.style?.stroke,
        filter:
          selectedEdge === edge.id
            ? 'drop-shadow(0 0 8px rgba(0,0,0,0.3))'
            : 'none',
      },
      selected: selectedEdge === edge.id,
    }));
  }, [edges, selectedEdge]);

  // Apply active page highlighting to nodes and manage z-index for dragged nodes
  const styledNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      style: {
        ...node.style,
        zIndex:
          draggedNodeId === node.id ? 9999 : activePageId === node.id ? 10 : 1,
        filter:
          activePageId === node.id
            ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.6))'
            : 'none',
        border:
          activePageId === node.id
            ? '3px solid #3b82f6'
            : node.style?.border || 'none',
      },
    }));
  }, [nodes, activePageId, draggedNodeId]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const hasOnlySelected = changes.every(
        (change) => change.type === 'select'
      );
      if (!hasOnlySelected) {
        console.log('onNodeschanges with changes');
        setNodes((nodesSnapshot) => {
          const updatedNodes = applyNodeChanges(changes, nodesSnapshot);

          // Notify parent about form changes for synchronization
          if (debouncedOnFormChange) {
            debouncedOnFormChange(updatedNodes, edges);
          }

          return updatedNodes;
        });
      } else {
        console.log('onNodeschanges with no changes ONLY selected');
      }

      // Set selection changing flag
      setIsSelectionChanging(true);
      console.log('Setting isSelectionChanging to true');

      // Handle node selection
      let hasNewSelection = false;

      // First pass: check if there's a new selection coming
      changes.forEach((change) => {
        if (change.type === 'select' && change.selected) {
          hasNewSelection = true;
        }
      });

      // Second pass: handle the changes
      changes.forEach((change) => {
        if (change.type === 'select') {
          console.log(
            'Node selection change:',
            change.id,
            'selected:',
            change.selected,
            'activePageId:',
            activePageId,
            'hasNewSelection:',
            hasNewSelection
          );

          if (change.selected) {
            // Store the previous selection before updating
            setLastSelectedNode(selectedNode);
            setSelectedNode(change.id);
            // Always open the node editor for any selected node
            console.log('Opening node editor for:', change.id);
            setNodeEditorOpen(true);
            setEdgeEditorOpen(false);
          } else {
            // Node is being deselected
            if (!hasNewSelection) {
              // Only clear if no new selection is coming
              console.log(
                'Node deselected with no new selection, clearing selectedNode'
              );
              setSelectedNode(null);
            } else {
              console.log(
                'Node deselected but new selection coming, keeping selectedNode'
              );
            }
          }
        }
      });

      // Clear selection changing flag after a delay
      setTimeout(() => {
        console.log('Setting isSelectionChanging to false');
        setIsSelectionChanging(false);
      }, 500);
    },
    [setNodes, activePageId, debouncedOnFormChange, edges, selectedNode]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      console.log('onEdgesChange with changes');
      const hasOnlySelected = changes.every(
        (change) => change.type === 'select'
      );
      if (!hasOnlySelected) {
        setEdges((edgesSnapshot) => {
          const updatedEdges = applyEdgeChanges(changes, edgesSnapshot);

          // Notify parent about form changes for synchronization
          if (debouncedOnFormChange) {
            debouncedOnFormChange(nodes, updatedEdges);
          }

          return updatedEdges;
        });
      }
      // Handle edge selection
      changes.forEach((change) => {
        if (change.type === 'select') {
          setSelectedEdge(change.selected ? change.id : null);
          if (change.selected) {
            setEdgeEditorOpen(true);
            setNodeEditorOpen(false); // Close node editor if open
          }
        }
      });
    },
    [debouncedOnFormChange, nodes]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((edgesSnapshot) => {
        const updatedEdges = addEdge(params, edgesSnapshot);

        // Notify parent about form changes for synchronization
        if (debouncedOnFormChange) {
          debouncedOnFormChange(nodes, updatedEdges);
        }

        return updatedEdges;
      });
    },
    [debouncedOnFormChange, nodes]
  );

  // Handle edge reconnection
  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges((edgesSnapshot) => {
        const updatedEdges = reconnectEdge(
          oldEdge,
          newConnection,
          edgesSnapshot
        );

        // Notify parent about form changes for synchronization
        if (debouncedOnFormChange) {
          debouncedOnFormChange(nodes, updatedEdges);
        }

        return updatedEdges;
      });
    },
    [debouncedOnFormChange, nodes]
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(selectedEdge === edge.id ? null : edge.id);
      if (selectedEdge !== edge.id) {
        setEdgeEditorOpen(true);
        setNodeEditorOpen(false); // Close node editor if open
      }
    },
    [selectedEdge]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Debug logging
      console.log('Node clicked:', node.id, 'Active page:', activePageId);
      console.log('Current selectedNode:', selectedNode);

      // Set the selected node and open the node editor
      setSelectedNode(node.id);
      setSelectedEdge(null); // Clear edge selection
      setNodeEditorOpen(true);
      setEdgeEditorOpen(false);
    },
    [activePageId, selectedNode]
  );

  const onSaveNode = useCallback(
    (nodeId: string, pageData: Omit<PageProps, 'id'>) => {
      console.log(
        'FormFlow: onSaveNode called with nodeId:',
        nodeId,
        'pageData:',
        pageData
      );
      setNodes((currentNodes) => {
        // Find the current node to check if isEndPage changed
        const currentNode = currentNodes.find((node) => node.id === nodeId);
        const currentPage = (currentNode?.data as { page: PageProps })?.page;
        const currentIsEndPage = currentPage?.isEndPage || false;
        const newIsEndPage = pageData.isEndPage || false;

        // Only update version if isEndPage changed
        const shouldUpdateVersion = currentIsEndPage !== newIsEndPage;

        let updatedNodes;
        if (shouldUpdateVersion) {
          // Only recreate the node if isEndPage changed (for handle re-registration)
          const filteredNodes = currentNodes.filter(
            (node) => node.id !== nodeId
          );
          const updatedNode = {
            id: nodeId,
            type: 'tooltip',
            position: currentNodes.find((n) => n.id === nodeId)?.position || {
              x: 0,
              y: 0,
            },
            data: {
              page: {
                id: nodeId,
                ...pageData,
              },
              version: Date.now(),
            },
          };
          updatedNodes = [...filteredNodes, updatedNode];
        } else {
          // Just update the page data without recreating the node
          updatedNodes = currentNodes.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  page: {
                    id: nodeId,
                    ...pageData,
                  },
                },
              };
            }
            return node;
          });
        }

        // Notify parent about form changes for synchronization
        if (debouncedOnFormChange) {
          console.log(
            'FormFlow: Calling onFormChange with',
            updatedNodes.length,
            'nodes and',
            edges.length,
            'edges'
          );
          debouncedOnFormChange(updatedNodes, edges);
        } else {
          console.log('FormFlow: onFormChange is not defined');
        }

        return updatedNodes;
      });
    },
    [debouncedOnFormChange, edges]
  );

  const onUpdateEdge = useCallback(
    (edgeId: string, branchIndex: number | null) => {
      setEdges((currentEdges) => {
        const updatedEdges = currentEdges.map((edge) => {
          if (edge.id === edgeId) {
            // Update edge label, styling, and type based on branch selection
            if (branchIndex !== null) {
              const sourceNode = nodes.find((n) => n.id === edge.source);
              const sourcePage = (sourceNode?.data as { page: PageProps })
                ?.page;
              const branch = sourcePage?.branches?.[branchIndex];

              if (branch) {
                return {
                  ...edge,
                  label: `${branch.condition.field} ${branch.condition.operator} ${branch.condition.value}`,
                  type: 'smoothstep', // Branched edges use smoothstep
                  style: {
                    ...edge.style,
                    stroke: '#ff6b6b', // Red for branched edges
                    strokeWidth: 2,
                    cursor: 'pointer',
                  },
                  reconnectable: true, // Preserve reconnectable property
                };
              }
            } else {
              // Remove label and change to bezier curve edge for direct connection
              const newEdge = { ...edge };
              delete newEdge.label;
              return {
                ...newEdge,
                type: 'default', // Direct edges use bezier curves
                style: {
                  ...newEdge.style,
                  stroke: '#4ecdc4', // Blue for direct edges
                  strokeWidth: 2,
                  cursor: 'pointer',
                },
                reconnectable: true, // Preserve reconnectable property
              };
            }
          }
          return edge;
        });

        // Notify parent about form changes for synchronization
        if (debouncedOnFormChange) {
          debouncedOnFormChange(nodes, updatedEdges);
        }

        return updatedEdges;
      });
    },
    [nodes, debouncedOnFormChange]
  );

  // Helper function to extract all existing field IDs from the current flow
  const getAllExistingFieldIds = useCallback(() => {
    const existingFieldIds = new Set<string>();

    nodes.forEach((node) => {
      const page = (node.data as { page: PageProps })?.page;
      if (page?.components) {
        page.components.forEach((component) => {
          // Add the component's own ID
          if (component.id) {
            existingFieldIds.add(component.id);
          }

          // If it's a form component with children, add all child field IDs
          if (component.type === 'form' && component.children) {
            component.children.forEach((child) => {
              if (child.id) {
                existingFieldIds.add(child.id);
              }
            });
          }
        });
      }
    });

    return existingFieldIds;
  }, [nodes]);

  // Helper function to generate a unique field ID
  const generateUniqueFieldId = useCallback(
    (baseId: string, existingIds: Set<string>) => {
      let uniqueId = baseId;
      let counter = 1;

      while (existingIds.has(uniqueId)) {
        uniqueId = `${baseId}_${counter}`;
        counter++;
      }

      return uniqueId;
    },
    []
  );

  // Handle creating a new node
  const handleCreateNode = useCallback(
    (nodeData: { title: string; textFields: string[] }) => {
      // Generate a unique ID for the new node
      const newNodeId = `page-${Date.now()}`;

      // Get all existing field IDs to ensure uniqueness
      const existingFieldIds = getAllExistingFieldIds();

      // Create form components from text fields with unique IDs
      const formComponents = nodeData.textFields.map((field, index) => {
        const baseFieldId = `field-${index}`;
        const uniqueFieldId = generateUniqueFieldId(
          baseFieldId,
          existingFieldIds
        );

        // Add the new field ID to the set to ensure subsequent fields are also unique
        existingFieldIds.add(uniqueFieldId);

        return {
          type: 'input' as const,
          id: uniqueFieldId,
          label: field,
          props: {
            placeholder: `Enter ${field.toLowerCase()}`,
            inputType: 'text' as const,
          },
          validation: {
            required: true,
            minLength: 1,
          },
        };
      });

      // Create the new page with unique component IDs
      const newPage: PageProps = {
        id: newNodeId,
        title: nodeData.title,
        route: `/${newNodeId.toLowerCase().replace(/\s+/g, '-')}`,
        layout: 'vertical',
        components: [
          {
            type: 'text',
            id: generateUniqueFieldId(`${newNodeId}-intro`, existingFieldIds),
            label: '',
            props: {
              content: `Please fill out the following information for ${nodeData.title}.`,
            },
          },
          {
            type: 'form',
            id: generateUniqueFieldId(`${newNodeId}-form`, existingFieldIds),
            label: nodeData.title,
            children: formComponents,
          },
        ],
      };

      // Create the new node
      const newNode: Node = {
        id: newNodeId,
        type: 'tooltip',
        position: { x: 100, y: 100 }, // Default position
        data: { page: newPage },
      };

      // Add the new node to the flow
      setNodes((currentNodes) => [...currentNodes, newNode]);

      // Update the form definition to include the new page in the correct logical position
      const currentFormDef = currentForm;

      // Find the best position to insert the new page
      const insertPosition = findBestInsertPosition(
        currentFormDef.app.pages,
        newPage,
        selectedNode || undefined
      );

      // Insert the page in the logical order
      const reorderedPages = insertPageInLogicalOrder(
        currentFormDef.app.pages,
        newPage,
        insertPosition.insertAfterPageId
      );

      // Reorder all pages to match logical flow
      const finalPages = reorderPagesByLogicalFlow(reorderedPages);

      const updatedFormDef = {
        ...currentFormDef,
        app: {
          ...currentFormDef.app,
          pages: finalPages,
        },
      };

      // Update the current form
      setImportedForm(updatedFormDef);
      setImportedFormName('Custom Form with New Node');
    },
    [
      currentForm,
      setNodes,
      getAllExistingFieldIds,
      generateUniqueFieldId,
      selectedNode,
    ]
  );

  return (
    <div className="h-screen w-screen p-4 px-16 bg-gray-50 grid grid-rows-[auto_1fr]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">
          {currentForm.app.title} - Form Flow with Branches
        </h1>
        <p className="text-gray-600">
          This flow represents the pages in the form definition and their
          conditional connections. Red edges show conditional branches based on
          user responses, while blue edges show simple next page flows.
        </p>
        <div className="flex items-end gap-4 mt-4">
          <div className="flex gap-2">
            <button
              onClick={() => setCreateNodeModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
              title="Create a new form node"
            >
              <Plus className="w-4 h-4" />
              Create Node
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium"
            >
              {sidebarOpen ? 'Hide' : 'Show'} Form Preview
            </button>
            <button
              onClick={handleExportForm}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              title="Export form definition as JSON"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
            {(selectedNode || selectedEdge) && (
              <button
                onClick={() => {
                  if (nodeEditorOpen || edgeEditorOpen) {
                    setNodeEditorOpen(false);
                    setEdgeEditorOpen(false);
                  } else if (selectedNode) {
                    setNodeEditorOpen(true);
                  } else if (selectedEdge) {
                    setEdgeEditorOpen(true);
                  }
                }}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors font-medium"
              >
                {nodeEditorOpen || edgeEditorOpen ? 'Hide' : 'Show'} Editor
              </button>
            )}
          </div>
        </div>
      </div>
      <div className={`transition-all duration-300 relative`}>
        <ReactFlow
          nodes={styledNodes}
          edges={styledEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onNodeDragStart={(event, node) => {
            setDraggedNodeId(node.id);
          }}
          onNodeDrag={(event, node) => {
            // Keep the dragged node ID set during drag
            setDraggedNodeId(node.id);
          }}
          onNodeDragStop={(event, node) => {
            setDraggedNodeId(null);
          }}
          edgesReconnectable={true}
          fitView
          fitViewOptions={{ padding: 0.2, includeHiddenNodes: false }}
          maxZoom={2}
          minZoom={0.1}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      <FormPreviewSidebar
        formDefinition={completeFormDefinition as LibraryFormDefinition}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        lastUpdated={lastUpdated}
        onActivePageChange={setActivePageId}
      />

      <NodeEditorSidebar
        isOpen={nodeEditorOpen || edgeEditorOpen}
        onToggle={() => {
          // Simple toggle: if open, close; if closed and has selection, open
          if (nodeEditorOpen || edgeEditorOpen) {
            setNodeEditorOpen(false);
            setEdgeEditorOpen(false);
          } else if (selectedNode) {
            setNodeEditorOpen(true);
          } else if (selectedEdge) {
            setEdgeEditorOpen(true);
          }
          // If no selection and sidebar is closed, do nothing (can't open without selection)
        }}
        selectedNode={selectedNodeDetails}
        selectedEdge={selectedEdgeDetails}
        onSaveNode={onSaveNode}
        onUpdateEdge={onUpdateEdge}
      />

      <CreateNodeModal
        isOpen={createNodeModalOpen}
        onClose={() => setCreateNodeModalOpen(false)}
        onCreateNode={handleCreateNode}
      />
    </div>
  );
}

// export function App() {
//   const isMobile = useIsMobile();

//   if (isMobile) {
//     return <MobileWarning />;
//   }

//   return <Flow />;
// }

/*
========== PLACEHOLDER ==============
*/
interface BranchCondition {
  field: string;
  operator: string;
  value: string | number | boolean;
}

interface Branch {
  condition: BranchCondition;
  nextPage: string;
}

interface Page {
  id: string;
  title: string;
  route: string;
  components: Array<{
    id: string;
    type: string;
    label?: string;
    visibilityConditions?: Array<BranchCondition>;
  }>;
  nextPage?: string;
  branches?: Branch[];
  isEndPage?: boolean;
}

interface FormFlowProps {
  formJson: LibraryFormDefinition;
  onFormChange?: (nodes: Node[], edges: Edge[]) => void;
  onConflictDetected?: (conflict: any) => void;
  readOnly?: boolean;
}

const FormFlow: React.FC<FormFlowProps> = ({
  formJson,
  onFormChange,
  onConflictDetected,
  readOnly = false,
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileWarning />;
  }

  return (
    <Flow
      formDefinition={formJson}
      onFormChange={onFormChange}
      onConflictDetected={onConflictDetected}
      readOnly={readOnly}
    />
  );
};

export default FormFlow;
