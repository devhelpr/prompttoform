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
  const [zoom, setZoom] = useState(0.01); // Start with very small zoom to prevent jump
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPan, setInitialPan] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRendering, setIsRendering] = useState(true);

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
      // Allow panning at any zoom level (including when fitted to screen)
      e.preventDefault();
      e.stopPropagation();

      // Prevent text selection
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';

      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialPan(pan);
    },
    [pan]
  );

  // Handle wheel events for zooming and panning using native event listeners
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Get the container bounds and mouse position relative to container
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Check if this is a trackpad gesture (small deltaY values typically indicate trackpad)
      const isTrackpad = Math.abs(e.deltaY) < 100 && e.deltaMode === 0;

      if (isTrackpad && Math.abs(e.deltaY) > 0) {
        // Trackpad zoom - use regular wheel events for zooming with pointer as center
        const delta = e.deltaY > 0 ? 0.95 : 1.05;
        const newZoom = Math.max(0.1, Math.min(5, zoom * delta));

        // Calculate new pan to keep pointer position fixed
        const zoomRatio = newZoom / zoom;
        const newPanX = mouseX - (mouseX - pan.x) * zoomRatio;
        const newPanY = mouseY - (mouseY - pan.y) * zoomRatio;

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      } else {
        // Mouse wheel - always zoom with pointer as center
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(5, zoom * delta));

        // Calculate new pan to keep pointer position fixed
        const zoomRatio = newZoom / zoom;
        const newPanX = mouseX - (mouseX - pan.x) * zoomRatio;
        const newPanY = mouseY - (mouseY - pan.y) * zoomRatio;

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [zoom, pan.x, pan.y]);

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - panning
        if (zoom > 1) {
          const touch = e.touches[0];
          setIsDragging(true);
          setDragStart({ x: touch.clientX, y: touch.clientY });
          setInitialPan(pan);
        }
      } else if (e.touches.length === 2) {
        // Two touches - pinch to zoom
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        setDragStart({ x: distance, y: 0 });
        setInitialPan({ x: zoom, y: 0 });
      }
    },
    [zoom, pan]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && isDragging && zoom > 1) {
        // Single touch panning
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - dragStart.x;
        const deltaY = touch.clientY - dragStart.y;
        setPan({
          x: initialPan.x + deltaX,
          y: initialPan.y + deltaY,
        });
      } else if (e.touches.length === 2) {
        // Two touches - pinch to zoom
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        const scale = distance / dragStart.x;
        const newZoom = Math.max(0.1, Math.min(5, initialPan.x * scale));
        setZoom(newZoom);
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
      if (isDragging) {
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

      // Restore text selection
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';

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

          // Apply CSS to all SVG elements to prevent interference with panning
          const svgElement = mermaidRef.current.querySelector('svg');
          if (svgElement) {
            // Set pointer events to none to prevent interference with panning
            svgElement.style.pointerEvents = 'none';
            svgElement.style.userSelect = 'none';

            // Apply to all child elements as well
            const allElements = svgElement.querySelectorAll('*');
            allElements.forEach((element) => {
              const htmlElement = element as HTMLElement;
              htmlElement.style.pointerEvents = 'none';
              htmlElement.style.userSelect = 'none';
            });
          }

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
                  // Calculate fit-to-screen immediately
                  if (containerRef.current) {
                    const container = containerRef.current;
                    const containerRect = container.getBoundingClientRect();

                    // Get SVG dimensions from the actual SVG element
                    const svgWidth = svg.getBBox
                      ? svg.getBBox().width
                      : svg.clientWidth;
                    const svgHeight = svg.getBBox
                      ? svg.getBBox().height
                      : svg.clientHeight;

                    // Account for control panel space (80px from right) and add padding
                    const padding = 40;
                    const availableWidth =
                      containerRect.width - 100 - padding * 2;
                    const availableHeight = containerRect.height - padding * 2;

                    const scaleX = availableWidth / svgWidth;
                    const scaleY = availableHeight / svgHeight;
                    const scale = Math.min(scaleX, scaleY, 1);

                    // Calculate centered position
                    const scaledWidth = svgWidth * scale;
                    const scaledHeight = svgHeight * scale;
                    const centerX = (containerRect.width - scaledWidth) / 2;
                    const centerY = (containerRect.height - scaledHeight) / 2;

                    // Set the final zoom and position immediately
                    setZoom(scale);
                    setPan({ x: centerX, y: centerY });
                    setIsInitialized(true);

                    // Use requestAnimationFrame to ensure the state updates are applied before showing
                    requestAnimationFrame(() => {
                      setIsRendering(false);
                    });
                  }
                } else {
                  attemptFit(attempts + 1);
                }
              }, 50 * (attempts + 1));
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
    <div className="w-full h-full relative bg-white rounded-lg border border-zinc-300">
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
        style={{
          overflow: 'hidden',
        }}
      >
        <div
          ref={mermaidRef}
          className="absolute top-0 left-0 origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left',
            transition:
              isInitialized && !isRendering
                ? 'transform 0.2s ease-out'
                : 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            opacity: isRendering ? 0 : 1,
            visibility: isRendering ? 'hidden' : 'visible',
          }}
        />

        {/* Transparent overlay for capturing mouse events */}
        <div
          className="absolute inset-0"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            pointerEvents: 'auto',
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
};

export default FormFlowMermaid;
