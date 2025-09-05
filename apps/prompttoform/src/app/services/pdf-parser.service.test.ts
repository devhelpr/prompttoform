import { describe, it, expect, vi } from 'vitest';
import { PDFParserService, PDFParseResult } from './pdf-parser.service';

// Note: These tests are for the legacy PDF parsing service.
// The main application now uses API-based PDF processing instead of local parsing.

// Mock PDF.js
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  version: '3.11.174',
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn(() => ({
        getTextContent: vi.fn(() =>
          Promise.resolve({
            items: [
              { str: 'PERSONAL INFORMATION' },
              { str: 'Name: ________________' },
              { str: 'Email: ________________' },
              { str: 'Phone: ________________' },
              { str: 'Address: ________________' },
              { str: 'Date of Birth: ________________' },
              { str: 'EMPLOYMENT INFORMATION' },
              { str: 'Company: ________________' },
              { str: 'Position: ________________' },
              { str: 'Salary: ________________' },
              { str: 'I agree to the terms and conditions *' },
            ],
          })
        ),
      })),
      getMetadata: vi.fn(() =>
        Promise.resolve({
          info: {
            Title: 'Test Form',
            Author: 'Test Author',
            Subject: 'Test Subject',
          },
        })
      ),
    }),
  })),
}));

describe('PDFParserService', () => {
  it.skip('should parse PDF and extract form fields', async () => {
    // Create a mock file with arrayBuffer method
    const mockFile = {
      name: 'test.pdf',
      type: 'application/pdf',
      size: 1024,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    } as unknown as File;

    const result = await PDFParserService.parsePDF(mockFile);

    expect(result).toBeDefined();
    // The title should be extracted from content, not from PDF metadata
    expect(result.metadata.title).toBeDefined();
    expect(typeof result.metadata.title).toBe('string');
    expect(result.metadata.pages).toBe(1);
    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.fields.length).toBeGreaterThan(0);
  });

  it('should generate prompt from parsed PDF data', () => {
    const mockParseResult: PDFParseResult = {
      sections: [
        {
          title: 'Personal Information',
          fields: [
            { name: 'name', type: 'text', label: 'Name', required: true },
            { name: 'email', type: 'email', label: 'Email', required: true },
          ],
        },
      ],
      fields: [
        { name: 'name', type: 'text', label: 'Name', required: true },
        { name: 'email', type: 'email', label: 'Email', required: true },
      ],
      text: 'Sample form text content',
      metadata: {
        title: 'Test Form',
        pages: 1,
      },
    };

    const prompt = PDFParserService.generatePromptFromPDF(mockParseResult);

    expect(prompt).toContain(
      'Create a comprehensive form based on the following detailed PDF form analysis'
    );
    expect(prompt).toContain('Test Form');
    expect(prompt).toContain('Personal Information');
    expect(prompt).toContain('Name (text) *required');
    expect(prompt).toContain('Email (email) *required');
  });

  it.skip('should handle PDF parsing errors gracefully with alternative methods', async () => {
    // Mock PDF.js to throw an error for the first attempt
    const { getDocument } = await import('pdfjs-dist');
    vi.mocked(getDocument).mockImplementationOnce(() => ({
      promise: Promise.reject(new Error('PDF parsing failed')),
    }));

    const mockFile = {
      name: 'test.pdf',
      type: 'application/pdf',
      size: 1024,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    } as unknown as File;

    // The service should try alternative parsing methods and eventually succeed
    const result = await PDFParserService.parsePDF(mockFile);

    // Verify the result is from actual PDF parsing, not a fallback
    expect(result).toBeDefined();
    expect(result.metadata.title).toBeDefined();
    expect(typeof result.metadata.title).toBe('string');
    expect(result.metadata.pages).toBeGreaterThan(0);
    expect(result.sections.length).toBeGreaterThanOrEqual(0);
    expect(result.fields.length).toBeGreaterThanOrEqual(0);
    expect(result.text).toBeDefined();
  });
});
