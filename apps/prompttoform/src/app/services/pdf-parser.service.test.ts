import { describe, it, expect, vi } from 'vitest';
import { PDFParserService, PDFParseResult } from './pdf-parser.service';

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
  it('should parse PDF and extract form fields', async () => {
    // Create a mock file with arrayBuffer method
    const mockFile = {
      name: 'test.pdf',
      type: 'application/pdf',
      size: 1024,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    } as unknown as File;

    const result = await PDFParserService.parsePDF(mockFile);

    expect(result).toBeDefined();
    expect(result.metadata.title).toBe('Test Form');
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
      'Create a form based on the following PDF form structure'
    );
    expect(prompt).toContain('Test Form');
    expect(prompt).toContain('Personal Information');
    expect(prompt).toContain('Name (text) *required');
    expect(prompt).toContain('Email (email) *required');
  });

  it('should handle PDF parsing errors gracefully with fallback', async () => {
    // Mock PDF.js to throw an error
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

    // Now the service should fall back to simple parsing instead of throwing
    const result = await PDFParserService.parsePDF(mockFile);

    // Verify fallback result
    expect(result).toBeDefined();
    expect(result.metadata.title).toBe('test.pdf');
    expect(result.metadata.pages).toBe(1);
    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.fields.length).toBeGreaterThan(0);
    expect(result.text).toContain('Comprehensive form structure detected');
  });
});
