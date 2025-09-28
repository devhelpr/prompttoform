import React, {
  useMemo,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import mermaid from 'mermaid';

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

interface ThankYouPage {
  title?: string;
  message?: string;
  showRestartButton?: boolean;
  customActions?: Array<{
    label: string;
    action: 'restart' | 'back' | 'custom';
    customAction?: string;
    className?: string;
  }>;
}

interface FormFlowMermaidProps {
  formJson: {
    app: {
      pages: Page[];
      thankYouPage?: ThankYouPage;
    };
  };
}

const FormFlowMermaid: React.FC<FormFlowMermaidProps> = ({ formJson }) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  // Zoom and pan state
  const [zoom, setZoom] = useState(1); // Start with 1 for proper text rendering
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPan, setInitialPan] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  // Zoom and pan control functions
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.2, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.2, 0.1));
  }, []);

  const handleFitToScreen = useCallback(() => {
    if (containerRef.current && mermaidRef.current) {
      const container = containerRef.current;
      const svg = mermaidRef.current.querySelector('svg');

      if (svg) {
        const containerRect = container.getBoundingClientRect();

        // Get SVG dimensions from the actual SVG element
        const svgWidth = svg.getBBox ? svg.getBBox().width : svg.clientWidth;
        const svgHeight = svg.getBBox ? svg.getBBox().height : svg.clientHeight;

        // Account for control panel space (80px from right) and add padding
        const padding = 40;
        const availableWidth = containerRect.width - 100 - padding * 2;
        const availableHeight = containerRect.height - padding * 2;

        const scaleX = availableWidth / svgWidth;
        const scaleY = availableHeight / svgHeight;
        const scale = Math.min(scaleX, scaleY, 1);

        // Calculate centered position
        const scaledWidth = svgWidth * scale;
        const scaledHeight = svgHeight * scale;
        const centerX = (containerRect.width - scaledWidth) / 2;
        const centerY = (containerRect.height - scaledHeight) / 2;

        setZoom(scale);
        setPan({ x: centerX, y: centerY });
        setIsInitialized(true);
      }
    }
  }, []);

  // Mouse/touch event handlers for panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom > 1) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialPan(pan);
      }
    },
    [zoom, pan]
  );

  // Handle wheel events for trackpad panning
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // Only prevent default for vertical scrolling when zoomed in
      if (zoom > 1 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [zoom]
  );

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (zoom > 1 && e.touches.length === 1) {
        const touch = e.touches[0];
        setIsDragging(true);
        setDragStart({ x: touch.clientX, y: touch.clientY });
        setInitialPan(pan);
      }
    },
    [zoom, pan]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isDragging && zoom > 1 && e.touches.length === 1) {
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - dragStart.x;
        const deltaY = touch.clientY - dragStart.y;
        setPan({
          x: initialPan.x + deltaX,
          y: initialPan.y + deltaY,
        });
      }
    },
    [isDragging, dragStart, initialPan, zoom]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    // Initialize mermaid with more stable configuration
    mermaid.initialize({
      startOnLoad: false, // We'll render manually
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: false,
        htmlLabels: false, // Disable HTML labels to avoid DOM issues
        curve: 'basis',
        nodeSpacing: 50,
        rankSpacing: 50,
      },
      fontFamily: 'Arial, sans-serif',
    });

    // Cleanup function
    const currentRef = mermaidRef.current;
    return () => {
      if (currentRef) {
        currentRef.innerHTML = '';
      }
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isInitialized && zoom <= 1.1) {
        // Only auto-fit if we're at default zoom and initialized
        setTimeout(handleFitToScreen, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleFitToScreen, zoom, isInitialized]);

  // Global mouse event listeners for panning
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && zoom > 1) {
        e.preventDefault();
        e.stopPropagation();
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        setPan({
          x: initialPan.x + deltaX,
          y: initialPan.y + deltaY,
        });
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove, {
        passive: false,
      });
      document.addEventListener('mouseup', handleGlobalMouseUp, {
        passive: false,
      });
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, initialPan, zoom]);

  const mermaidDiagram = useMemo(() => {
    const pages = formJson.app.pages;
    const thankYouPage = formJson.app.thankYouPage;
    let diagram = 'graph TD\n';

    // Add nodes for pages
    pages.forEach((page) => {
      const nodeId = page.id.replace(/[^a-zA-Z0-9]/g, '_');
      diagram += `    ${nodeId}["${page.title}"]\n`;
    });

    // Add thank you page node if it exists
    if (thankYouPage) {
      const thankYouTitle = thankYouPage.title || 'Thank You Page';
      diagram += `    thank_you_page["${thankYouTitle}"]\n`;
    }

    // Add edges
    pages.forEach((page) => {
      const sourceId = page.id.replace(/[^a-zA-Z0-9]/g, '_');

      // Add default next page edge
      if (page.nextPage) {
        const targetId = page.nextPage.replace(/[^a-zA-Z0-9]/g, '_');
        diagram += `    ${sourceId} --> ${targetId}\n`;
      }

      // Add branch edges
      if (page.branches) {
        page.branches.forEach((branch) => {
          const targetId = branch.nextPage.replace(/[^a-zA-Z0-9]/g, '_');
          const condition = `${branch.condition.field} ${branch.condition.operator} ${branch.condition.value}`;
          diagram += `    ${sourceId} -->|${condition}| ${targetId}\n`;
        });
      }

      // Add edge from end pages to thank you page
      if (page.isEndPage && thankYouPage) {
        diagram += `    ${sourceId} -->|Submit| thank_you_page\n`;
      }
    });

    return diagram;
  }, [formJson]);

  useEffect(() => {
    async function renderMermaid() {
      if (mermaidRef.current && mermaidDiagram) {
        try {
          // Clear the container first
          mermaidRef.current.innerHTML = '';

          // Ensure the container is attached to the DOM
          if (!mermaidRef.current.isConnected) {
            console.warn('Mermaid container not connected to DOM');
            return;
          }

          // Use a simpler approach - render directly into the container
          const { svg, bindFunctions } = await mermaid.render(
            `mermaid-diagram-${idRef.current}`,
            mermaidDiagram
          );

          // Set the SVG content
          mermaidRef.current.innerHTML = svg;

          // Bind functions to the container
          if (bindFunctions && mermaidRef.current) {
            bindFunctions(mermaidRef.current);
          }

          // Fit to screen on initial render with smooth transition
          const attemptFit = (attempts = 0) => {
            if (attempts < 5) {
              setTimeout(() => {
                const svg = mermaidRef.current?.querySelector('svg');
                if (svg && svg.getBBox && svg.getBBox().width > 0) {
                  // Use multiple requestAnimationFrame calls for smoother transition
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      handleFitToScreen();
                    });
                  });
                } else {
                  attemptFit(attempts + 1);
                }
              }, 100 * (attempts + 1));
            }
          };
          attemptFit();
        } catch (e) {
          console.error('Error rendering mermaid diagram:', e);
        }
      }
    }

    if (mermaidDiagram) {
      // Add a small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        renderMermaid();
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [mermaidDiagram, handleFitToScreen]);

  return (
    <div className="w-full h-full relative bg-white rounded-lg border border-zinc-300 relative">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 bg-white border border-zinc-300 rounded-md shadow-sm hover:bg-zinc-50 transition-colors flex items-center justify-center"
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 bg-white border border-zinc-300 rounded-md shadow-sm hover:bg-zinc-50 transition-colors flex items-center justify-center"
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
              d="M18 12H6"
            />
          </svg>
        </button>
        <button
          onClick={handleFitToScreen}
          className="w-8 h-8 bg-white border border-zinc-300 rounded-md shadow-sm hover:bg-zinc-50 transition-colors flex items-center justify-center"
          title="Fit to Screen"
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
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </button>
        <div className="w-8 bg-white border border-zinc-300 rounded-md px-1 py-1 text-xs text-zinc-600 text-center">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Diagram Container */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        style={{
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          overflow: 'hidden',
        }}
      >
        <div
          ref={mermaidRef}
          className="absolute top-0 left-0 origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left',
            transition: isInitialized ? 'transform 0.2s ease-out' : 'none',
          }}
        />
      </div>
    </div>
  );
};

export default FormFlowMermaid;
