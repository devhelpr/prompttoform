import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowInstance,
  Position,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

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
  formJson: {
    app: {
      pages: Page[];
    };
  };
}

interface FlowData {
  nodes: Node[];
  edges: Edge[];
}

const BRANCH_X_OFFSET = 250;

const FormFlow: React.FC<FormFlowProps> = ({ formJson }) => {
  const { nodes: initialNodes, edges: initialEdges }: FlowData = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let yOffset = 0;
    const pageMap = new Map<string, { y: number; x: number }>();
    const branchTargetIds = new Set<string>();
    const defaultNextIds = new Set<string>();

    // First, collect all branch targets and default nextPage targets
    formJson.app.pages.forEach((page) => {
      if (page.branches) {
        page.branches.forEach((branch) => {
          branchTargetIds.add(branch.nextPage);
        });
      }
      if (page.nextPage) {
        defaultNextIds.add(page.nextPage);
      }
    });

    // Now, create nodes with x offset for branch-only targets
    formJson.app.pages.forEach((page) => {
      // If this page is a branch target but not a default nextPage, offset it
      const isBranchOnlyTarget =
        branchTargetIds.has(page.id) && !defaultNextIds.has(page.id);
      const x = isBranchOnlyTarget ? BRANCH_X_OFFSET : 0;
      nodes.push({
        id: page.id,
        type: "default",
        position: { x, y: yOffset },
        data: {
          label: page.title,
          type: "page",
        },
        style: {
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "16px",
          width: 250,
          fontSize: "14px",
          fontWeight: "500",
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
      pageMap.set(page.id, { y: yOffset, x });
      yOffset += 200;
    });

    // Draw edges for each page
    formJson.app.pages.forEach((page) => {
      const hasBranches = !!(page.branches && page.branches.length > 0);
      // Branches: draw step (elbow) edges for each branch
      if (hasBranches) {
        page.branches!.forEach((branch, idx) => {
          if (branch.nextPage && pageMap.has(branch.nextPage)) {
            edges.push({
              id: `${page.id}-branch-${idx}`,
              source: page.id,
              target: branch.nextPage,
              type: "step",
              animated: true,
              style: { stroke: "#f59e0b", strokeWidth: 2 },
              label: `${branch.condition.field} ${branch.condition.operator} ${branch.condition.value}`,
              labelStyle: { fill: "#f59e0b", fontWeight: 500 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#f59e0b",
              },
            });
          }
        });
      }
      // Default nextPage: use step if branches exist, otherwise straight
      if (page.nextPage && pageMap.has(page.nextPage)) {
        edges.push({
          id: `${page.id}-next`,
          source: page.id,
          target: page.nextPage,
          type: hasBranches ? "step" : "straight",
          animated: true,
          style: { stroke: "#3b82f6", strokeWidth: 2 },
          label: "Next",
          labelStyle: { fill: "#3b82f6", fontWeight: 500 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#3b82f6",
          },
        });
      }
    });

    return { nodes, edges };
  }, [formJson]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onInit = useCallback((reactFlowInstance: ReactFlowInstance) => {
    reactFlowInstance.fitView();
  }, []);

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default FormFlow;
