import React, { useRef, useState } from "react";
import { X, Plus } from "lucide-react";

interface CreateNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNode: (nodeData: { title: string; textFields: string[] }) => void;
}

export function CreateNodeModal({
  isOpen,
  onClose,
  onCreateNode,
}: CreateNodeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [formData, setFormData] = useState<{
    nodeTitle: string;
    textFields: string;
  }>({
    nodeTitle: "",
    textFields: "",
  });

  // Handle dialog open/close
  React.useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Parse text fields (split by newlines and filter empty lines)
    const textFields = formData.textFields
      .split("\n")
      .map((field) => field.trim())
      .filter((field) => field.length > 0);

    if (formData.nodeTitle.trim() && textFields.length > 0) {
      onCreateNode({
        title: formData.nodeTitle.trim(),
        textFields,
      });

      // Reset form and close modal
      setFormData({ nodeTitle: "", textFields: "" });
      onClose();
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/50 backdrop:backdrop-blur-sm bg-white rounded-lg shadow-xl border border-gray-200 p-0 max-w-2xl w-full max-h-[90vh] overflow-hidden fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      onClose={onClose}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Create New Form Node
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-600 mb-6">
              Enter the details for your new form node. You can add multiple
              text fields that will be included in the form.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="nodeTitle"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Node Title *
                </label>
                <input
                  type="text"
                  id="nodeTitle"
                  value={formData.nodeTitle}
                  onChange={(e) =>
                    handleInputChange("nodeTitle", e.target.value)
                  }
                  placeholder="Enter the title for this form node"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="textFields"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Text Fields (one per line) *
                </label>
                <textarea
                  id="textFields"
                  value={formData.textFields}
                  onChange={(e) =>
                    handleInputChange("textFields", e.target.value)
                  }
                  placeholder="Enter text field labels, one per line&#10;Example:&#10;Full Name&#10;Email Address&#10;Phone Number"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter each field label on a separate line
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !formData.nodeTitle.trim() || !formData.textFields.trim()
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Node
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </dialog>
  );
}
