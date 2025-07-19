import { ReactNode } from 'react';

interface FormEditorLayoutProps {
  sidebar: ReactNode;
  mainContent: ReactNode;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function FormEditorLayout({
  sidebar,
  mainContent,
  sidebarCollapsed,
  onToggleSidebar,
}: FormEditorLayoutProps) {
  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        className={`bg-white border-r border-zinc-200 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-16' : 'w-80 lg:w-96'
        }`}
      >
        {/* Sidebar Toggle Button */}
        <div className="flex justify-end p-2 border-b border-zinc-200">
          <button
            onClick={onToggleSidebar}
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

        {/* Sidebar Content */}
        <div
          className={`${
            sidebarCollapsed ? 'hidden' : 'block'
          } h-full overflow-y-auto`}
        >
          {sidebar}
        </div>

        {/* Collapsed Sidebar Icon */}
        {sidebarCollapsed && (
          <div className="flex flex-col items-center py-4 space-y-4">
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
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-zinc-50">{mainContent}</div>
      </div>
    </div>
  );
}
