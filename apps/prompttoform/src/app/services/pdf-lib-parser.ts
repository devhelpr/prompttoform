/* PDF parser using pdf-lib library.
 * - Extracts AcroForm fields (name, type, value, options)
 * - Extracts text content from all pages
 * - Better browser compatibility and form field support
 * - More reliable than custom parser for complex PDFs
 */

import {
  PDFDocument,
  PDFField,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
  PDFDropdown,
  PDFOptionList,
} from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

export interface PDFLibFormField {
  name: string;
  cleanName: string;
  label?: string;
  type: string;
  value?: string | boolean | string[];
  options?: string[];
  required?: boolean;
  readOnly?: boolean;
  description?: string;
  section?: string;
}

export interface PDFLibSection {
  title: string;
  content: string;
}

export interface PDFLibParseResult {
  rawText: string;
  titles: string[];
  sections: PDFLibSection[];
  formFields: PDFLibFormField[];
  warnings: string[];
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
    pageCount: number;
  };
}

/**
 * Clean up technical field names to be more human-readable
 */
function cleanFieldName(technicalName: string): string {
  // Remove array indices and technical prefixes
  let clean = technicalName
    .replace(/\[\d+\]/g, '') // Remove [0], [1], etc.
    .replace(/^[A-Za-z]+\.Sida\d+\./, '') // Remove any prefix.Sida1. pattern
    .replace(/^sub/, '') // Remove sub prefix
    .replace(/^txt/, '') // Remove txt prefix
    .replace(/^dat/, '') // Remove dat prefix
    .replace(/^krs/, '') // Remove krs prefix
    .replace(/^RadioButtonList$/, 'Selection') // Generic radio button
    .replace(/^AngePeriod$/, 'Period') // Period field
    .replace(/^txtOvrigt$/, 'Additional Information'); // Additional info

  // Convert camelCase to readable format
  clean = clean.replace(/([A-Z])/g, ' $1').trim();

  // Capitalize first letter
  clean = clean.charAt(0).toUpperCase() + clean.slice(1);

  return clean || technicalName;
}

/**
 * Determine section based on field name
 */
function determineSection(technicalName: string): string {
  const name = technicalName.toLowerCase();

  // Generic patterns that work across languages
  if (name.includes('contact') || name.includes('kontakt'))
    return 'Contact Information';
  if (name.includes('address') || name.includes('adress'))
    return 'Address Information';
  if (name.includes('personal') || name.includes('person'))
    return 'Personal Information';
  if (name.includes('name') || name.includes('namn')) return 'Name Information';
  if (name.includes('phone') || name.includes('telefon'))
    return 'Contact Information';
  if (name.includes('email') || name.includes('epost'))
    return 'Contact Information';
  if (name.includes('birth') || name.includes('fodelse'))
    return 'Personal Information';
  if (name.includes('date') || name.includes('datum'))
    return 'Date Information';
  if (name.includes('additional') || name.includes('ovrigt'))
    return 'Additional Information';
  if (name.includes('period') || name.includes('period'))
    return 'Period Information';

  return 'General Information';
}

/**
 * Extract field labels from PDF text content
 */
function extractFieldLabels(
  textContent: string,
  fieldNames: string[]
): Map<string, string> {
  const labelMap = new Map<string, string>();

  if (!textContent || fieldNames.length === 0) {
    return labelMap;
  }

  // Split text into lines and words for analysis
  const lines = textContent
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const fieldName of fieldNames) {
    const cleanName = cleanFieldName(fieldName).toLowerCase();

    // Look for potential labels near the field name or in the text
    for (const line of lines) {
      // Look for patterns that might indicate a field label
      // Common patterns: "Field Name:", "Field Name *", "Enter Field Name", etc.
      const patterns = [
        new RegExp(`([^:]*)\\s*:?\\s*$`, 'i'), // Text ending with colon
        new RegExp(`([^\\*]*)\\s*\\*\\s*$`, 'i'), // Text ending with asterisk (required)
        new RegExp(`(enter|fill|provide)\\s+([^\\s]+)`, 'i'), // "Enter fieldname"
        new RegExp(`([^\\s]+)\\s+(field|input|box)`, 'i'), // "fieldname field"
      ];

      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const potentialLabel = match[1] || match[2];
          if (
            potentialLabel &&
            potentialLabel.length > 2 &&
            potentialLabel.length < 50
          ) {
            // Check if this label might be related to our field
            const labelWords = potentialLabel.toLowerCase().split(/\s+/);
            const fieldWords = cleanName.split(/\s+/);

            // Simple similarity check
            const hasCommonWords = labelWords.some((word) =>
              fieldWords.some(
                (fieldWord) =>
                  word.includes(fieldWord) || fieldWord.includes(word)
              )
            );

            if (
              hasCommonWords ||
              Math.abs(potentialLabel.length - cleanName.length) < 10
            ) {
              labelMap.set(fieldName, potentialLabel.trim());
              break;
            }
          }
        }
      }
    }
  }

  return labelMap;
}

/**
 * Extract text content using pdfjs-dist
 */
async function extractTextWithPdfJs(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('[PDF-Lib Parser] Initializing pdfjs-dist for text extraction');

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    console.log(
      `[PDF-Lib Parser] PDF loaded with pdfjs-dist, pages: ${pdf.numPages}`
    );

    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Extract text items and join them
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim();

        if (pageText && pageText.trim().length > 0) {
          textParts.push(pageText);
          console.log(
            `[PDF-Lib Parser] Extracted text from page ${i}: ${pageText.length} characters`
          );
        } else {
          console.log(`[PDF-Lib Parser] No text content found on page ${i}`);
        }
      } catch (error: any) {
        console.log(
          `[PDF-Lib Parser] Error extracting text from page ${i}: ${
            error?.message || error
          }`
        );
        // Don't add error messages to the text content
      }
    }

    const fullText = textParts.join('\n\n');
    console.log(
      `[PDF-Lib Parser] Total text extracted: ${fullText.length} characters`
    );
    return fullText;
  } catch (error: any) {
    console.log(
      `[PDF-Lib Parser] Error with pdfjs-dist text extraction: ${
        error?.message || error
      }`
    );
    return ''; // Return empty string instead of error message
  }
}

/**
 * Parse PDF using pdf-lib library
 */
export async function parsePDFWithLib(
  arrayBuffer: ArrayBuffer
): Promise<PDFLibParseResult> {
  console.log(`[PDF-Lib Parser] ===== Starting PDF parsing with pdf-lib =====`);
  console.log(
    `[PDF-Lib Parser] Input buffer size: ${arrayBuffer.byteLength} bytes`
  );

  const warnings: string[] = [];

  try {
    // Load PDF document
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    console.log(
      `[PDF-Lib Parser] PDF loaded successfully, pages: ${pdfDoc.getPageCount()}`
    );

    // Extract metadata
    const metadata = {
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
      subject: pdfDoc.getSubject(),
      creator: pdfDoc.getCreator(),
      producer: pdfDoc.getProducer(),
      creationDate: pdfDoc.getCreationDate(),
      modificationDate: pdfDoc.getModificationDate(),
      pageCount: pdfDoc.getPageCount(),
    };

    console.log(`[PDF-Lib Parser] Metadata extracted:`, metadata);
    console.log(`[PDF-Lib Parser] Title candidates:`, {
      title: metadata.title,
      subject: metadata.subject,
      creator: metadata.creator,
      producer: metadata.producer,
    });

    // Extract text content using pdfjs-dist first (needed for label extraction)
    console.log(`[PDF-Lib Parser] ===== Extracting text content =====`);
    const textContent = await extractTextWithPdfJs(arrayBuffer);
    console.log(
      `[PDF-Lib Parser] Extracted ${textContent.length} characters of text`
    );

    // Extract form fields
    console.log(`[PDF-Lib Parser] ===== Extracting form fields =====`);
    const formFields = await extractFormFields(pdfDoc);
    console.log(`[PDF-Lib Parser] Extracted ${formFields.length} form fields`);

    // Extract field labels from text content
    console.log(`[PDF-Lib Parser] ===== Extracting field labels =====`);
    const fieldNames = formFields.map((field) => field.name);
    const fieldLabels = extractFieldLabels(textContent, fieldNames);
    console.log(
      `[PDF-Lib Parser] Found ${fieldLabels.size} field labels from text`
    );

    // Re-extract form fields with labels
    console.log(
      `[PDF-Lib Parser] ===== Re-extracting form fields with labels =====`
    );
    const formFieldsWithLabels = await extractFormFields(pdfDoc, fieldLabels);
    console.log(
      `[PDF-Lib Parser] Re-extracted ${formFieldsWithLabels.length} form fields with labels`
    );

    // Build sections from text
    console.log(`[PDF-Lib Parser] ===== Building document structure =====`);
    const { titles, sections } = buildSectionsFromText(textContent);
    console.log(
      `[PDF-Lib Parser] Built ${sections.length} sections with ${titles.length} titles`
    );

    const result: PDFLibParseResult = {
      rawText: textContent,
      titles,
      sections,
      formFields: formFieldsWithLabels,
      warnings,
      metadata,
    };

    console.log(`[PDF-Lib Parser] ===== Parsing complete =====`);
    console.log(`[PDF-Lib Parser] Results:`);
    console.log(
      `[PDF-Lib Parser] - Raw text length: ${textContent.length} characters`
    );
    console.log(`[PDF-Lib Parser] - Titles: ${titles.length}`);
    console.log(`[PDF-Lib Parser] - Sections: ${sections.length}`);
    console.log(`[PDF-Lib Parser] - Form fields: ${formFields.length}`);
    console.log(`[PDF-Lib Parser] - Warnings: ${warnings.length}`);

    return result;
  } catch (error: any) {
    const errorMsg = `PDF parsing failed: ${error?.message || error}`;
    console.error(`[PDF-Lib Parser] ${errorMsg}`);
    warnings.push(errorMsg);

    // Return minimal result on error
    return {
      rawText: '',
      titles: [],
      sections: [],
      formFields: [],
      warnings,
      metadata: {
        pageCount: 0,
      },
    };
  }
}

/**
 * Extract form fields from PDF document
 */
async function extractFormFields(
  pdfDoc: PDFDocument,
  fieldLabels?: Map<string, string>
): Promise<PDFLibFormField[]> {
  const formFields: PDFLibFormField[] = [];

  try {
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log(
      `[PDF-Lib Parser] Found ${fields.length} form fields to process`
    );

    for (const field of fields) {
      try {
        const fieldInfo = extractFieldInfo(field, fieldLabels);
        if (fieldInfo) {
          console.log(
            `[PDF-Lib Parser] Found form field: "${fieldInfo.name}" [${
              fieldInfo.type
            }]${fieldInfo.value ? ` = "${fieldInfo.value}"` : ''}${
              fieldInfo.label ? ` (Label: "${fieldInfo.label}")` : ''
            }`
          );
          formFields.push(fieldInfo);
        }
      } catch (fieldError: any) {
        console.log(
          `[PDF-Lib Parser] Error processing field ${field.getName()}: ${
            fieldError?.message || fieldError
          }`
        );
      }
    }
  } catch (error: any) {
    console.log(
      `[PDF-Lib Parser] Error extracting form fields: ${
        error?.message || error
      }`
    );
  }

  return formFields;
}

/**
 * Extract information from a single form field
 */
function extractFieldInfo(
  field: PDFField,
  fieldLabels?: Map<string, string>
): PDFLibFormField | null {
  const name = field.getName();
  if (!name) return null;

  const cleanName = cleanFieldName(name);
  const section = determineSection(name);
  const label = fieldLabels?.get(name);

  const commonInfo = {
    name,
    cleanName,
    label,
    section,
    required: field.isRequired(),
    readOnly: field.isReadOnly(),
  };

  // Handle different field types
  if (field instanceof PDFTextField) {
    return {
      ...commonInfo,
      type: 'text',
      value: field.getText(),
      description: `Text input field for ${cleanName.toLowerCase()}`,
    };
  } else if (field instanceof PDFCheckBox) {
    return {
      ...commonInfo,
      type: 'checkbox',
      value: field.isChecked(),
      description: `Checkbox for ${cleanName.toLowerCase()}`,
    };
  } else if (field instanceof PDFRadioGroup) {
    const options = field.getOptions();
    return {
      ...commonInfo,
      type: 'radio',
      value: field.getSelected(),
      options: options.map((opt: any) => opt.label || opt.toString()),
      description: `Radio button selection for ${cleanName.toLowerCase()}`,
    };
  } else if (field instanceof PDFDropdown) {
    const options = field.getOptions();
    return {
      ...commonInfo,
      type: 'select',
      value: field.getSelected(),
      options: options.map((opt: any) => opt.label || opt.toString()),
      description: `Dropdown selection for ${cleanName.toLowerCase()}`,
    };
  } else if (field instanceof PDFOptionList) {
    const options = field.getOptions();
    return {
      ...commonInfo,
      type: 'multiselect',
      value: field.getSelected(),
      options: options.map((opt: any) => opt.label || opt.toString()),
      description: `Multi-select list for ${cleanName.toLowerCase()}`,
    };
  } else {
    // Generic field
    return {
      ...commonInfo,
      type: 'unknown',
      value: field.toString(),
      description: `Unknown field type for ${cleanName.toLowerCase()}`,
    };
  }
}

/**
 * Build sections from text content
 */
function buildSectionsFromText(text: string): {
  titles: string[];
  sections: PDFLibSection[];
} {
  if (!text.trim()) {
    return { titles: [], sections: [] };
  }

  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  const sections: PDFLibSection[] = [];
  let currentSection: PDFLibSection | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Simple heuristic: lines that are all caps or end with colon might be titles
    if (
      trimmedLine.length > 0 &&
      (trimmedLine === trimmedLine.toUpperCase() ||
        trimmedLine.endsWith(':') ||
        trimmedLine.match(/^[A-Z][^a-z]*$/))
    ) {
      // Start new section
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: trimmedLine,
        content: '',
      };
    } else {
      // Add to current section
      if (!currentSection) {
        currentSection = {
          title: 'Document',
          content: '',
        };
      }
      currentSection.content +=
        (currentSection.content ? '\n' : '') + trimmedLine;
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  const titles = sections.length > 0 ? [sections[0].title] : [];
  return { titles, sections };
}

/**
 * Extract the best title from multiple sources
 */
function extractBestTitle(parsed: PDFLibParseResult): string {
  console.log(`[PDF-Lib Parser] ===== Extracting best title =====`);

  // Priority order: metadata title > subject > first section title > first line of text
  const candidates = [
    parsed.metadata.title,
    parsed.metadata.subject,
    parsed.titles.length > 0 ? parsed.titles[0] : null,
    parsed.sections.length > 0 ? parsed.sections[0].title : null,
  ].filter(Boolean);

  // Also try to extract title from the first few lines of text
  if (parsed.rawText) {
    const firstLines = parsed.rawText
      .split('\n')
      .slice(0, 5)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    for (const line of firstLines) {
      // Look for lines that might be titles (short, capitalized, not too long)
      if (
        line.length > 5 &&
        line.length < 100 &&
        (line === line.toUpperCase() || /^[A-Z]/.test(line)) &&
        !line.includes('Page ') &&
        !line.includes('FormularInterna') &&
        !line.includes('txt') &&
        !line.includes('dat') &&
        !line.includes('krs') &&
        !/^\d+$/.test(line) && // Not just numbers
        !/^[a-z]/.test(line)
      ) {
        // Not starting with lowercase
        candidates.push(line);
        break;
      }
    }
  }

  // Find the best candidate
  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) {
      console.log(`[PDF-Lib Parser] Selected title: "${candidate}"`);
      return candidate.trim();
    }
  }

  console.log(`[PDF-Lib Parser] No suitable title found, using default`);
  return 'Document';
}

/**
 * Generate a prompt-ready summary from parsed PDF
 */
export function toPromptSummary(parsed: PDFLibParseResult): string {
  console.log(`[PDF-Lib Parser] ===== Generating prompt summary =====`);

  const lines: string[] = [];

  // Extract and add the best title
  const title = extractBestTitle(parsed);
  lines.push(`Title: ${title}`);
  console.log(`[PDF-Lib Parser] Added title: ${title}`);

  // Add sections (only if they have meaningful content)
  const meaningfulSections = parsed.sections.filter(
    (section) =>
      section.content &&
      section.content.trim().length > 0 &&
      !section.content.includes('[Text extraction failed]') &&
      !section.content.includes('[Error extracting text]') &&
      !section.content.includes('[Page') &&
      !section.content.includes('Text extraction not implemented')
  );

  if (meaningfulSections.length > 0) {
    lines.push('Sections:');
    console.log(
      `[PDF-Lib Parser] Adding ${meaningfulSections.length} meaningful sections to summary`
    );
    for (const section of meaningfulSections.slice(0, 10)) {
      const content =
        section.content.slice(0, 200) +
        (section.content.length > 200 ? '…' : '');
      lines.push(`- ${section.title}: ${content}`);
    }
  } else {
    console.log(
      `[PDF-Lib Parser] No meaningful sections found, skipping sections`
    );
  }

  // Add form fields grouped by section (only meaningful fields)
  const meaningfulFields = parsed.formFields.filter(
    (field) =>
      field.name &&
      field.name.trim().length > 0 &&
      !field.name.includes('[Error') &&
      !field.name.includes('[Failed') &&
      field.type !== 'unknown'
  );

  if (meaningfulFields.length > 0) {
    console.log(
      `[PDF-Lib Parser] Adding ${meaningfulFields.length} meaningful form fields to summary`
    );

    // Group fields by section
    const fieldsBySection = meaningfulFields.reduce((acc, field) => {
      const section = field.section || 'General Information';
      if (!acc[section]) acc[section] = [];
      acc[section].push(field);
      return acc;
    }, {} as Record<string, typeof meaningfulFields>);

    // Add each section
    for (const [sectionName, fields] of Object.entries(fieldsBySection)) {
      lines.push(`\n${sectionName}:`);
      for (const field of fields) {
        // Use extracted label if available, otherwise use clean name
        const displayName = field.label || field.cleanName;
        let fieldDesc = `- ${displayName} (${field.type})`;

        if (field.description) {
          fieldDesc += ` - ${field.description}`;
        }
        if (field.value !== undefined && field.value !== '') {
          fieldDesc += ` [Current value: ${JSON.stringify(field.value)}]`;
        }
        if (field.options && field.options.length > 0) {
          fieldDesc += ` [Options: ${field.options.join(', ')}]`;
        }
        if (field.required) {
          fieldDesc += ' [Required]';
        }
        lines.push(fieldDesc);
      }
    }
  } else {
    console.log(
      `[PDF-Lib Parser] No meaningful form fields found, skipping form fields`
    );
  }

  const summary = lines.join('\n');
  console.log(
    `[PDF-Lib Parser] Generated summary: ${summary.length} characters`
  );

  // Final check: if summary only contains title and no other meaningful content,
  // provide a more helpful message
  if (lines.length <= 1 || (lines.length === 2 && lines[1].trim() === '')) {
    console.log(
      `[PDF-Lib Parser] Summary contains only title, adding fallback message`
    );
    return `${summary}\n\nNote: Limited information could be extracted from this PDF. The form generation will be based on the available metadata and structure.`;
  }

  return summary;
}
