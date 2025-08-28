# PDF Upload Feature

This feature allows users to upload PDF forms and automatically extract form fields and sections to generate prompts for the LLM.

## Components

### PdfUploadButton
A button component that handles PDF file selection and parsing.

**Props:**
- `onPdfParsed: (prompt: string, parseResult: PDFParseResult) => void` - Callback when PDF is successfully parsed
- `disabled?: boolean` - Whether the button should be disabled

**Features:**
- File type validation (PDF only)
- File size validation (max 10MB)
- Loading state during parsing
- Error handling and display

## Services

### PDFParserService
Service for parsing PDF files and extracting form information.

**Main Methods:**
- `parsePDF(file: File): Promise<PDFParseResult>` - Parse a PDF file
- `generatePromptFromPDF(parseResult: PDFParseResult): string` - Generate LLM prompt from parsed data

**Extracted Information:**
- Form sections (headers, titles)
- Form fields (name, type, required status)
- PDF metadata (title, author, subject, pages)
- Full text content

**Supported Field Types:**
- text, email, phone, date, number
- checkbox, radio, select, textarea

## Usage

The PDF upload button is integrated into the "Describe your form" page. When a PDF is uploaded:

1. The PDF is parsed to extract form structure
2. Form fields and sections are identified
3. A structured prompt is generated for the LLM
4. The prompt is appended to the existing textarea content
5. The LLM can then generate a form based on the PDF structure

## Dependencies

- `pdfjs-dist` - PDF parsing library
- `@types/pdfjs-dist` - TypeScript definitions

## Testing

The feature includes comprehensive tests for:
- PDF parsing functionality
- Prompt generation
- Error handling
- Field type detection
- Section extraction
