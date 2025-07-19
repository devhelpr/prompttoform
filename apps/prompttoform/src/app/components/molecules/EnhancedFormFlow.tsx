import { useState, useEffect, useRef } from 'react';
import { UIJson } from '../../types/form-generator.types';

interface EnhancedFormFlowProps {
  formJson: UIJson;
  className?: string;
}

interface FlowNode {
  id: string;
  title: string;
  type: 'page' | 'component' | 'condition';
  route?: string;
  components?: number;
  isEndPage?: boolean;
  position: { x: number; y: number };
}

interface FlowConnection {
  from: string;
  to: string;
  type: 'next' | 'condition' | 'end';
}

export function EnhancedFormFlow({
  formJson,
  className = '',
}: EnhancedFormFlowProps) {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [connections, setConnections] = useState<FlowConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate flow nodes and connections from form JSON
  useEffect(() => {
    if (!formJson?.app?.pages) return;

    const newNodes: FlowNode[] = [];
    const newConnections: FlowConnection[] = [];
    let yOffset = 0;

    formJson.app.pages.forEach((page, pageIndex) => {
      // Create page node
      const pageNode: FlowNode = {
        id: page.id,
        title: page.title,
        type: 'page',
        route: page.route,
        components: page.components?.length || 0,
        isEndPage: page.isEndPage,
        position: { x: 0, y: yOffset },
      };
      newNodes.push(pageNode);

      // Create component nodes for this page
      if (page.components) {
        page.components.forEach((component, compIndex) => {
          const componentNode: FlowNode = {
            id: `${page.id}-${component.id}`,
            title: component.label || component.id,
            type: 'component',
            position: { x: 200, y: yOffset + compIndex * 80 },
          };
          newNodes.push(componentNode);

          // Connect component to page
          newConnections.push({
            from: page.id,
            to: componentNode.id,
            type: 'next',
          });
        });
      }

      // Connect pages
      if (pageIndex < formJson.app.pages.length - 1) {
        newConnections.push({
          from: page.id,
          to: formJson.app.pages[pageIndex + 1].id,
          type: 'next',
        });
      }

      yOffset += Math.max(120, (page.components?.length || 0) * 80 + 40);
    });

    setNodes(newNodes);
    setConnections(newConnections);
  }, [formJson]);

  // Mouse event handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left click only
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.3));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getNodeColor = (node: FlowNode) => {
    switch (node.type) {
      case 'page':
        return node.isEndPage ? 'bg-green-500' : 'bg-blue-500';
      case 'component':
        return 'bg-indigo-500';
      case 'condition':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getNodeIcon = (node: FlowNode) => {
    switch (node.type) {
      case 'page':
        return node.isEndPage ? (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      case 'component':
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  return (
    <div
      className={`relative bg-white rounded-lg border border-zinc-200 overflow-hidden ${className}`}
    >
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 bg-white rounded-lg shadow-lg border border-zinc-200 p-2">
        <button
          onClick={handleZoomIn}
          className="p-2 text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          title="Zoom In"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          title="Zoom Out"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
            />
          </svg>
        </button>
        <button
          onClick={handleResetView}
          className="p-2 text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          title="Reset View"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
        <div className="text-xs text-zinc-500 px-2">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Flow Canvas */}
      <div
        ref={containerRef}
        className="w-full h-96 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Connections */}
          {connections.map((connection, index) => {
            const fromNode = nodes.find((n) => n.id === connection.from);
            const toNode = nodes.find((n) => n.id === connection.to);

            if (!fromNode || !toNode) return null;

            const fromX = fromNode.position.x + 100;
            const fromY = fromNode.position.y + 30;
            const toX = toNode.position.x;
            const toY = toNode.position.y + 30;

            return (
              <g key={index}>
                <line
                  x1={fromX}
                  y1={fromY}
                  x2={toX}
                  y2={toY}
                  stroke={connection.type === 'end' ? '#10b981' : '#6b7280'}
                  strokeWidth={2}
                  strokeDasharray={
                    connection.type === 'condition' ? '5,5' : 'none'
                  }
                  markerEnd="url(#arrowhead)"
                />
                {connection.type === 'condition' && (
                  <text
                    x={(fromX + toX) / 2}
                    y={(fromY + toY) / 2 - 10}
                    textAnchor="middle"
                    className="text-xs fill-zinc-600"
                  >
                    Condition
                  </text>
                )}
              </g>
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
            </marker>
          </defs>

          {/* Nodes */}
          {nodes.map((node) => (
            <g key={node.id}>
              <rect
                x={node.position.x}
                y={node.position.y}
                width={200}
                height={60}
                rx={8}
                className={`${getNodeColor(
                  node
                )} transition-colors duration-200 ${
                  selectedNode === node.id ? 'ring-4 ring-indigo-300' : ''
                }`}
                onClick={() =>
                  setSelectedNode(selectedNode === node.id ? null : node.id)
                }
                style={{ cursor: 'pointer' }}
              />
              <foreignObject
                x={node.position.x + 10}
                y={node.position.y + 10}
                width={180}
                height={40}
              >
                <div className="flex items-center space-x-2 text-white">
                  {getNodeIcon(node)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {node.title}
                    </div>
                    {node.route && (
                      <div className="text-xs opacity-75">{node.route}</div>
                    )}
                    {node.components !== undefined && (
                      <div className="text-xs opacity-75">
                        {node.components} components
                      </div>
                    )}
                  </div>
                </div>
              </foreignObject>
            </g>
          ))}
        </svg>

        {/* Empty State */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-zinc-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
                />
              </svg>
              <p className="text-sm">No form flow data available</p>
              <p className="text-xs text-zinc-400 mt-1">
                Generate a form to see the flow diagram
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg border border-zinc-200 p-4 max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-zinc-900">Node Details</h4>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-zinc-400 hover:text-zinc-600"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          {(() => {
            const node = nodes.find((n) => n.id === selectedNode);
            if (!node) return null;

            return (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Title:</span> {node.title}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {node.type}
                </div>
                {node.route && (
                  <div>
                    <span className="font-medium">Route:</span> {node.route}
                  </div>
                )}
                {node.components !== undefined && (
                  <div>
                    <span className="font-medium">Components:</span>{' '}
                    {node.components}
                  </div>
                )}
                {node.isEndPage && (
                  <div className="text-green-600 font-medium">End Page</div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
