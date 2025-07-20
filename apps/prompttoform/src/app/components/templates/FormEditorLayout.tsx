import { ReactNode, useEffect, useState } from 'react';
import { ResponsiveNavbar } from './ResponsiveNavbar';

interface FormEditorLayoutProps {
  sidebar: ReactNode;
  mainContent: ReactNode;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onSettingsClick: () => void;
  onHistoryClick: () => void;
  onImportJsonClick: () => void;
  showNavbar?: boolean;
}

export function FormEditorLayout({
  sidebar,
  mainContent,
  sidebarCollapsed,
  onToggleSidebar,
  onSettingsClick,
  onHistoryClick,
  onImportJsonClick,
  showNavbar = true,
}: FormEditorLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-collapse sidebar on mobile when overlay is shown
  useEffect(() => {
    if (isMobile && showMobileOverlay && sidebarCollapsed) {
      onToggleSidebar();
    }
  }, [isMobile, showMobileOverlay, sidebarCollapsed, onToggleSidebar]);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setShowMobileOverlay(!showMobileOverlay);
    } else {
      onToggleSidebar();
    }
  };

  return (
    <div className="flex h-full relative">
      {/* Mobile Overlay */}
      {isMobile && showMobileOverlay && (
        <div
          className="fixed inset-0 bg-zinc-900 opacity-25 z-40 lg:hidden"
          onClick={() => setShowMobileOverlay(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`bg-white border-r border-zinc-200 transition-all duration-300 ease-in-out ${
          isMobile
            ? showMobileOverlay
              ? 'fixed left-0 top-0 h-full w-80 z-50 shadow-xl'
              : 'hidden'
            : sidebarCollapsed
            ? 'w-12'
            : 'w-80 lg:w-96'
        }`}
      >
        {/* Sidebar Toggle Button */}
        <div className="flex justify-end p-2 border-b border-zinc-200">
          <button
            onClick={handleSidebarToggle}
            className="p-2 rounded-md text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            aria-label={
              sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${
                sidebarCollapsed ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        {/* Fixed-width content container with clip-path animation */}
        <div className="relative h-full">
          {/* Sidebar Content - Fixed width, clipped during animation */}
          <div
            className={`absolute inset-0 w-80 lg:w-96 transition-all duration-300 ease-in-out ${
              sidebarCollapsed
                ? 'clip-path-inset-0-0-0-full'
                : 'clip-path-inset-0-0-0-0'
            }`}
            style={{
              clipPath: sidebarCollapsed
                ? 'inset(0 100% 0 0)'
                : 'inset(0 0% 0 0)',
            }}
          >
            <div className="h-full overflow-y-auto">{sidebar}</div>
          </div>

          {/* Collapsed Sidebar Icon - Properly centered */}
          <div
            className={`absolute top-4 transition-all duration-300 ease-in-out ${
              sidebarCollapsed && !isMobile ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              left: sidebarCollapsed ? '6px' : '50%',
              transform: sidebarCollapsed ? 'none' : 'translateX(-50%)',
            }}
          >
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-indigo-600"
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Menu Bar - Show when sidebar is collapsed or on mobile */}
        {showNavbar && (sidebarCollapsed || isMobile) && (
          <ResponsiveNavbar
            onSettingsClick={onSettingsClick}
            onHistoryClick={onHistoryClick}
            onImportJsonClick={onImportJsonClick}
          />
        )}

        {/* Mobile Sidebar Toggle Button */}
        {isMobile && (
          <div className="lg:hidden p-2 border-b border-zinc-200 bg-white">
            <button
              onClick={() => setShowMobileOverlay(true)}
              className="inline-flex items-center px-3 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              Show Sidebar
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-zinc-50">{mainContent}</div>
      </div>
    </div>
  );
}
