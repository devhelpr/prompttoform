import { UIJson } from '../../types/form-generator.types';
import { ViewMode } from './AppStateManager';
import { FormRenderer } from '@devhelpr/react-forms';
import FormFlow from './FormFlow';
import FormFlowMermaid from './FormFlowMermaid';
import { useEffect, useMemo } from 'react';

interface FormPreviewPanelProps {
  parsedJson: UIJson | null;
  activeTab: ViewMode;
  onTabChange: (tab: ViewMode) => void;
  onJsonChange: (json: string) => void;
  generatedJson: string;
  onCopyToClipboard: () => void;
  onDownload: () => void;
  onDownloadZip: () => void;
  isZipDownloading: boolean;
  siteUrl?: string;
}

export function FormPreviewPanel({
  parsedJson,
  activeTab,
  onTabChange,
  onJsonChange,
  generatedJson,
  onCopyToClipboard,
  onDownload,
  onDownloadZip,
  isZipDownloading,
  siteUrl,
}: FormPreviewPanelProps) {
  const tabs = useMemo(
    () => [
      {
        id: 'form' as ViewMode,
        label: 'Form Preview',
        icon: '📋',
        shortcut: '1',
      },
      { id: 'flow' as ViewMode, label: 'Flow', icon: '🔄', shortcut: '2' },
      {
        id: 'mermaid-flow' as ViewMode,
        label: 'Visual Flow',
        icon: '📊',
        shortcut: '3',
      },
      { id: 'json' as ViewMode, label: 'JSON', icon: '{}', shortcut: '4' },
    ],
    []
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Tab switching shortcuts (1-4)
      if (e.key >= '1' && e.key <= '4') {
        const tabIndex = parseInt(e.key) - 1;
        if (tabs[tabIndex]) {
          e.preventDefault();
          onTabChange(tabs[tabIndex].id);
        }
      }

      // Copy shortcut (Cmd/Ctrl + C)
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        e.preventDefault();
        onCopyToClipboard();
      }

      // Download shortcut (Cmd/Ctrl + D)
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        onDownload();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTabChange, onCopyToClipboard, onDownload, tabs]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'form':
        return parsedJson && parsedJson.app ? (
          <div className="bg-white p-4 sm:p-6 rounded-lg border border-zinc-300 overflow-auto max-h-[calc(100vh-200px)]">
            <FormRenderer formJson={parsedJson} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-zinc-500">
            No form data available
          </div>
        );

      case 'flow':
        return parsedJson && parsedJson.app ? (
          <div className="bg-white p-4 sm:p-6 rounded-lg border border-zinc-300 overflow-auto max-h-[calc(100vh-200px)]">
            <FormFlow formJson={parsedJson} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-zinc-500">
            No form data available
          </div>
        );

      case 'mermaid-flow':
        return parsedJson && parsedJson.app ? (
          <div className="bg-white p-4 sm:p-6 rounded-lg border border-zinc-300 overflow-auto max-h-[calc(100vh-200px)]">
            <FormFlowMermaid formJson={parsedJson} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-zinc-500">
            No form data available
          </div>
        );

      case 'json':
        return (
          <div className="space-y-4">
            <textarea
              value={generatedJson}
              onChange={(e) => onJsonChange(e.target.value)}
              className="w-full h-64 sm:h-96 p-4 font-mono text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              spellCheck={false}
              placeholder="JSON content will appear here..."
              aria-label="JSON editor"
            />
            <div className="flex justify-end">
              <button
                onClick={() => {
                  // TODO: Implement JSON validation
                  console.log('JSON updated');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Update Preview
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with tabs */}
      <div className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-900">Form Preview</h2>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={onCopyToClipboard}
              className="inline-flex items-center px-3 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors whitespace-nowrap"
              title="Copy to Clipboard (⌘+C)"
              aria-label="Copy to clipboard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                />
              </svg>
            </button>

            <button
              onClick={onDownload}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors whitespace-nowrap"
              title="Download JSON (⌘+D)"
              aria-label="Download JSON"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
            </button>

            <button
              onClick={onDownloadZip}
              disabled={isZipDownloading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              title="Download React Form Zip"
              aria-label="Download React form zip"
            >
              {isZipDownloading ? (
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="mt-4">
          <nav
            className="flex space-x-4 sm:space-x-8 overflow-x-auto pb-2 sm:pb-0"
            role="tablist"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                }`}
                title={`${tab.label} (${tab.shortcut})`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                <span className="ml-2 text-xs opacity-60">
                  ({tab.shortcut})
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Site URL display */}
        {siteUrl && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4 text-green-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span className="text-sm font-medium text-green-800">
                Live Site:
              </span>
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:text-green-800 underline truncate"
              >
                {siteUrl}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Tab content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
