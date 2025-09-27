import React, { useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  FileText,
  AlertCircle,
  CheckCircle,
  Settings,
} from "lucide-react";
import type { FormPage } from "@/types/form-page";

interface NodeEditorSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedNode: {
    id: string;
    page: FormPage;
  } | null;
  selectedEdge: {
    id: string;
    source: string;
    target: string;
    sourcePage: FormPage | null;
    targetPage: FormPage | null;
    currentBranchIndex: number | null;
  } | null;
  onSaveNode: (nodeId: string, pageData: Omit<FormPage, "id">) => void;
  onUpdateEdge: (edgeId: string, branchIndex: number | null) => void;
}

export function NodeEditorSidebar({
  isOpen,
  onToggle,
  selectedNode,
  selectedEdge,
  onSaveNode,
  onUpdateEdge,
}: NodeEditorSidebarProps) {
  const [jsonText, setJsonText] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  // Determine if we're editing a node or edge
  const isEditingNode = selectedNode !== null;
  const isEditingEdge = selectedEdge !== null;
  const isEditing = isEditingNode || isEditingEdge;

  // Update JSON text when selected node changes
  React.useEffect(() => {
    if (selectedNode) {
      // Create a copy of the page data without the id
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...pageDataWithoutId } = selectedNode.page;
      setJsonText(JSON.stringify(pageDataWithoutId, null, 2));
      setIsValid(true);
      setSaveStatus("idle");
    }
  }, [selectedNode]);

  // Validate JSON
  const validateJson = useCallback((text: string): boolean => {
    try {
      const parsed = JSON.parse(text);
      // Basic validation - ensure it has required fields
      return (
        typeof parsed === "object" &&
        parsed !== null &&
        typeof parsed.title === "string" &&
        typeof parsed.route === "string" &&
        typeof parsed.layout === "string" &&
        Array.isArray(parsed.components)
      );
    } catch {
      return false;
    }
  }, []);

  // Handle JSON text changes
  const handleJsonChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = event.target.value;
      setJsonText(text);
      setIsValid(validateJson(text));
    },
    [validateJson]
  );

  // Handle save for node
  const handleSaveNode = useCallback(() => {
    if (!selectedNode || !isValid) return;

    setSaveStatus("saving");

    try {
      const parsedData = JSON.parse(jsonText);
      onSaveNode(selectedNode.id, parsedData);
      setSaveStatus("success");

      // Reset success status after 2 seconds
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");

      // Reset error status after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [selectedNode, isValid, jsonText, onSaveNode]);

  // Handle edge branch change
  const handleBranchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!selectedEdge) return;

    const value = event.target.value;
    if (value === "direct") {
      onUpdateEdge(selectedEdge.id, null);
    } else {
      const branchIndex = parseInt(value);
      onUpdateEdge(selectedEdge.id, branchIndex);
    }
  };

  const selectValue =
    selectedEdge?.currentBranchIndex !== null && selectedEdge !== null
      ? selectedEdge.currentBranchIndex.toString()
      : "direct";

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ease-in-out z-30 ${
        isOpen ? "w-96" : "w-12"
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        disabled={!isEditing}
        className={`absolute -right-3 top-4 rounded-full p-1 shadow-md transition-all z-10 ${
          isEditing
            ? "bg-white border border-gray-200 hover:shadow-lg cursor-pointer"
            : "bg-gray-100 border border-gray-300 cursor-not-allowed opacity-50"
        }`}
      >
        {isOpen ? (
          <ChevronLeft
            className={`w-4 h-4 ${
              isEditing ? "text-gray-600" : "text-gray-400"
            }`}
          />
        ) : (
          <ChevronRight
            className={`w-4 h-4 ${
              isEditing ? "text-gray-600" : "text-gray-400"
            }`}
          />
        )}
      </button>

      {/* Sidebar Content */}
      {isOpen && (
        <>
          {isEditing ? (
            <div
              className="h-full flex flex-col w-96"
              style={{
                animation: "slideInFromLeft 0.3s ease-out forwards",
                transformOrigin: "left center",
              }}
            >
              {/* Header */}
              <div
                className="p-4 border-b border-gray-200"
                style={{
                  animation: "slideInFromLeft 0.3s ease-out 0.1s both",
                  transformOrigin: "left center",
                }}
              >
                <div className="flex items-center">
                  {isEditingNode ? (
                    <FileText className="w-5 h-5 text-gray-600 mr-2" />
                  ) : (
                    <Settings className="w-5 h-5 text-gray-600 mr-2" />
                  )}
                  <h2 className="text-lg font-semibold text-gray-800">
                    {isEditingNode ? "Node Editor" : "Edge Editor"}
                  </h2>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {isEditingNode
                    ? `Edit JSON for ${selectedNode?.page.title}`
                    : `Configure connection from ${selectedEdge?.sourcePage?.title} to ${selectedEdge?.targetPage?.title}`}
                </p>
              </div>

              {/* Node Editor Content */}
              {isEditingNode && selectedNode && (
                <>
                  {/* Page ID Display */}
                  <div
                    className="p-4 border-b border-gray-200 bg-gray-50"
                    style={{
                      animation: "slideInFromLeft 0.3s ease-out 0.15s both",
                      transformOrigin: "left center",
                    }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Page ID (Read-only)
                    </label>
                    <input
                      type="text"
                      value={selectedNode.id}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Page ID is managed by the flow and cannot be edited
                      directly
                    </p>
                  </div>

                  {/* JSON Editor */}
                  <div
                    className="flex-1 flex flex-col p-4"
                    style={{
                      animation: "slideInFromLeft 0.3s ease-out 0.2s both",
                      transformOrigin: "left center",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Page JSON
                      </label>
                      <div className="flex items-center">
                        {!isValid && (
                          <div className="flex items-center text-red-600 text-xs mr-2">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Invalid JSON
                          </div>
                        )}
                        {isValid && (
                          <div className="flex items-center text-green-600 text-xs mr-2">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Valid JSON
                          </div>
                        )}
                      </div>
                    </div>

                    <textarea
                      value={jsonText}
                      onChange={handleJsonChange}
                      className={`flex-1 w-full p-3 border rounded-md font-mono text-sm resize-none ${
                        isValid
                          ? "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          : "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                      }`}
                      placeholder="Enter valid JSON..."
                    />
                  </div>

                  {/* Save Button */}
                  <div
                    className="p-4 border-t border-gray-200"
                    style={{
                      animation: "slideInFromLeft 0.3s ease-out 0.25s both",
                      transformOrigin: "left center",
                    }}
                  >
                    <button
                      onClick={handleSaveNode}
                      disabled={!isValid || saveStatus === "saving"}
                      className={`w-full px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center ${
                        isValid && saveStatus !== "saving"
                          ? "bg-blue-500 text-white hover:bg-blue-600"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {saveStatus === "saving" && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      )}
                      {saveStatus === "success" && (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      {saveStatus === "error" && (
                        <AlertCircle className="w-4 h-4 mr-2" />
                      )}
                      {saveStatus === "idle" && (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {saveStatus === "saving" && "Saving..."}
                      {saveStatus === "success" && "Saved Successfully!"}
                      {saveStatus === "error" && "Save Failed"}
                      {saveStatus === "idle" && "Save Changes"}
                    </button>

                    {saveStatus === "error" && (
                      <p className="text-red-600 text-xs mt-2 text-center">
                        Failed to save. Please check your JSON and try again.
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Edge Editor Content */}
              {isEditingEdge && selectedEdge && (
                <div
                  className="flex-1 overflow-auto p-4"
                  style={{
                    animation: "slideInFromLeft 0.3s ease-out 0.1s both",
                    transformOrigin: "left center",
                  }}
                >
                  <div className="space-y-4">
                    {/* Source Page Info */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <h3 className="font-medium text-blue-800 mb-1">From</h3>
                      <p className="text-sm text-blue-700">
                        {selectedEdge.sourcePage?.title}
                      </p>
                    </div>

                    {/* Target Page Info */}
                    <div className="bg-green-50 rounded-lg p-3">
                      <h3 className="font-medium text-green-800 mb-1">To</h3>
                      <p className="text-sm text-green-700">
                        {selectedEdge.targetPage?.title}
                      </p>
                    </div>

                    {/* Connection Type */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h3 className="font-medium text-gray-800 mb-2">
                        Connection Type
                      </h3>

                      {selectedEdge.sourcePage?.branches &&
                      selectedEdge.sourcePage.branches.length > 0 ? (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Select branch condition:
                          </label>
                          <select
                            value={selectValue}
                            onChange={handleBranchChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="direct">
                              Direct connection (no condition)
                            </option>
                            {selectedEdge.sourcePage.branches.map(
                              (branch, index) => (
                                <option key={index} value={index}>
                                  {branch.condition.field}{" "}
                                  {branch.condition.operator}{" "}
                                  {branch.condition.value}
                                </option>
                              )
                            )}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Choose how this connection should be triggered
                          </p>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          <p>Direct connection</p>
                          <p className="text-xs text-gray-500 mt-1">
                            No branch conditions available in source page
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Current Configuration */}
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <h3 className="font-medium text-yellow-800 mb-1">
                        Current Configuration
                      </h3>
                      <p className="text-sm text-yellow-700">
                        {selectedEdge.currentBranchIndex !== null
                          ? `Using branch condition: ${
                              selectedEdge.sourcePage?.branches?.[
                                selectedEdge.currentBranchIndex
                              ]?.condition.field
                            } ${
                              selectedEdge.sourcePage?.branches?.[
                                selectedEdge.currentBranchIndex
                              ]?.condition.operator
                            } ${
                              selectedEdge.sourcePage?.branches?.[
                                selectedEdge.currentBranchIndex
                              ]?.condition.value
                            }`
                          : "Direct connection"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col w-96">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <Settings className="w-5 h-5 text-gray-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    No Selection
                  </h2>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Select a node or edge to edit
                </p>
              </div>
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No item selected</p>
                  <p className="text-sm">
                    Click on a node or edge to start editing
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
