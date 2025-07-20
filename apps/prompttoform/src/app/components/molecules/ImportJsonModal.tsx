import { useState, useRef, useEffect } from 'react';

interface ImportJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (json: string, prompt?: string) => void;
}

export function ImportJsonModal({
  isOpen,
  onClose,
  onImport,
}: ImportJsonModalProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [promptInput, setPromptInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    setError(null);

    if (value.trim()) {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object') {
          setIsValid(true);
        } else {
          setIsValid(false);
          setError('JSON must be a valid object');
        }
      } catch {
        setIsValid(false);
        setError('Invalid JSON format');
      }
    } else {
      setIsValid(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        handleJsonChange(content);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = () => {
    if (isValid && jsonInput.trim()) {
      onImport(jsonInput.trim(), promptInput.trim() || undefined);
      handleClose();
    }
  };

  const handleClose = () => {
    setJsonInput('');
    setPromptInput('');
    setError(null);
    setIsValid(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black backdrop:bg-opacity-50 rounded-lg p-0 border-0 shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden bg-white"
      onClose={handleClose}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">
            Import JSON Form
          </h2>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
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
      </div>

      {/* Content */}
      <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Upload JSON File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          {/* Or Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-zinc-500">
                or paste JSON directly
              </span>
            </div>
          </div>

          {/* JSON Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              JSON Content
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => handleJsonChange(e.target.value)}
              placeholder="Paste your JSON form definition here..."
              className={`w-full h-48 p-3 border rounded-md text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                error
                  ? 'border-red-300'
                  : isValid
                  ? 'border-green-300'
                  : 'border-zinc-300'
              }`}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            {isValid && (
              <p className="mt-1 text-sm text-green-600">✓ Valid JSON</p>
            )}
          </div>

          {/* Optional Prompt */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Original Prompt (Optional)
            </label>
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Enter the original prompt that was used to generate this form..."
              className="w-full h-20 p-3 border border-zinc-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50">
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!isValid}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import Form
          </button>
        </div>
      </div>
    </dialog>
  );
}
