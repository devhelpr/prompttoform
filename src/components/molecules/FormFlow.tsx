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
import dagre from "dagre";
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

const nodeWidth = 250;
const nodeHeight = 80;

function getLayoutedElements(nodes: Node[], edges: Edge[], direction = "TB") {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 600, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - (node.width ?? nodeWidth) / 2,
      y: nodeWithPosition.y - (node.height ?? nodeHeight) / 2,
    };
    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;
  });

  return { nodes, edges };
}

const FormFlow: React.FC<FormFlowProps> = ({ formJson }) => {
  const { nodes: initialNodes, edges: initialEdges }: FlowData = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
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

    // Now, create nodes (no manual x/y, dagre will handle it)
    formJson.app.pages.forEach((page) => {
      nodes.push({
        id: page.id,
        type: "default",
        data: {
          label: page.title,
          type: "page",
        },
        style: {
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "16px",
          width: nodeWidth,
          fontSize: "14px",
          fontWeight: "500",
        },
        position: { x: 0, y: 0 }, // will be set by dagre
      });
    });

    // Draw edges for each page
    formJson.app.pages.forEach((page) => {
      const hasBranches = !!(page.branches && page.branches.length > 0);
      // Branches: draw step (elbow) edges for each branch
      if (hasBranches) {
        page.branches!.forEach((branch, idx) => {
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
        });
      }
      // Default nextPage: use step if branches exist, otherwise straight
      if (page.nextPage) {
        edges.push({
          id: `${page.id}-next`,
          source: page.id,
          target: page.nextPage,
          type: "step",
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

    // Use dagre to layout nodes
    return getLayoutedElements(nodes, edges);
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
