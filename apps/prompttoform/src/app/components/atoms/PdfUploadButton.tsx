import { useState, useRef } from 'react';
import {
  parsePDFWithLib,
  toPromptSummary,
} from '../../services/pdf-lib-parser';

interface PdfUploadButtonProps {
  onPdfParsed: (prompt: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function PdfUploadButton({
  onPdfParsed,
  onError,
  disabled = false,
}: PdfUploadButtonProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      const errorMessage = 'Please select a valid PDF file';
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      const errorMessage = 'File size must be less than 10MB';
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      // Read the file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Parse the PDF using pdf-lib parser
      const parsedPDF = await parsePDFWithLib(arrayBuffer);

      // Generate a prompt summary from the parsed PDF
      const pdfSummary = toPromptSummary(parsedPDF);

      // Extract title for better prompt context
      const title =
        parsedPDF.metadata.title ||
        parsedPDF.metadata.subject ||
        (parsedPDF.titles.length > 0 ? parsedPDF.titles[0] : 'Document');

      // Create a comprehensive prompt that includes the PDF analysis
      const prompt = `Based on the following PDF document analysis for "${title}", create a form that captures all the necessary information:

${pdfSummary}

Please create a comprehensive form based on this "${title}" document. Include all relevant fields, sections, and validation rules that would be appropriate for collecting the information described in the document. The form should be structured to match the purpose and content of the "${title}" document.`;

      onPdfParsed(prompt);
    } catch (err) {
      console.error('Error processing PDF:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to process PDF file';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsParsing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isParsing}
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isParsing}
        className="inline-flex items-center justify-center px-4 py-3 border border-zinc-300 shadow-sm text-sm font-medium rounded-lg text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isParsing ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-zinc-500"
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
            Parsing PDF...
          </>
        ) : (
          <>
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Upload PDF
          </>
        )}
      </button>

      {/* Error display removed - errors are now handled by parent component */}
    </div>
  );
}
