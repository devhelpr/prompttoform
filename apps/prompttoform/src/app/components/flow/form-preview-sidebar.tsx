import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { FormRenderer, type FormDefinition } from "@devhelpr/react-forms";
import { useState, useEffect } from "react";

interface FormPreviewSidebarProps {
  formDefinition: FormDefinition;
  isOpen: boolean;
  onToggle: () => void;
  lastUpdated?: Date;
  onActivePageChange?: (pageId: string | null) => void;
}

export function FormPreviewSidebar({
  formDefinition,
  isOpen,
  onToggle,
  lastUpdated,
  onActivePageChange,
}: FormPreviewSidebarProps) {
  const [activePageId, setActivePageId] = useState<string | null>(null);

  useEffect(() => {
    console.log(
      "useeffect form-preview-sidebar formDefinition",
      formDefinition
    );
  }, [formDefinition]);

  // Reset active page when sidebar is closed
  useEffect(() => {
    console.log("useeffect form-preview-sidebar ", isOpen, activePageId);
    if (!isOpen && activePageId) {
      setActivePageId(null);
      onActivePageChange?.(null);
    }
  }, [isOpen, activePageId, onActivePageChange]);

  const handlePageChange = (event: {
    pageId: string;
    pageIndex: number;
    pageTitle: string;
    totalPages: number;
    isFirstPage: boolean;
    isLastPage: boolean;
    isEndPage: boolean;
    isConfirmationPage: boolean;
    previousPageId?: string;
    previousPageIndex?: number;
  }) => {
    console.log("Page change event received:", event);

    // Only update active page if it's not an automatic reset to the first page
    // when we already have an active page
    //event.pageIndex === 0 && event.pageId === "page1")
    if (activePageId && event.isFirstPage) {
      console.log("Ignoring automatic reset to first page", activePageId);
      return;
    }

    setActivePageId(event.pageId);
    onActivePageChange?.(event.pageId);
  };

  return (
    <div
      className={`fixed right-0 top-0 h-full bg-white shadow-lg border-l border-gray-200 transition-all duration-300 ease-in-out z-20 ${
        isOpen ? "w-96" : "w-12"
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -left-3 top-4 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      >
        {isOpen ? (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Sidebar Content */}
      {isOpen && (
        <div className="h-full flex flex-col w-96">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Form Preview
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Live preview of the complete form
                </p>
              </div>
              {lastUpdated && (
                <div className="flex items-center text-xs text-gray-500">
                  <Eye className="w-3 h-3 mr-1" />
                  Updated {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          {/* Form Preview */}
          <div className="flex-1 overflow-auto p-4">
            <div className="bg-gray-50 rounded-lg p-4 min-h-full">
              <FormRenderer
                formJson={formDefinition}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
