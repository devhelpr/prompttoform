// Import unpdf for browser-compatible PDF parsing
let unpdfLib: any = null;

// Initialize unpdf dynamically
async function initUnpdf() {
  if (!unpdfLib) {
    unpdfLib = await import('unpdf');
  }
  return unpdfLib;
}

export interface PDFFormField {
  name: string;
  type:
    | 'text'
    | 'checkbox'
    | 'radio'
    | 'select'
    | 'textarea'
    | 'date'
    | 'email'
    | 'number'
    | 'file'
    | 'password'
    | 'tel'
    | 'url';
  label?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
    step?: number;
    format?: string;
  };
  conditional?: {
    dependsOn?: string;
    showWhen?: string;
    hideWhen?: string;
  };
  group?: string;
  order?: number;
  description?: string;
  helpText?: string;
  defaultValue?: string;
  readonly?: boolean;
  disabled?: boolean;
  autocomplete?: string;
}

export interface PDFFormSection {
  title: string;
  fields: PDFFormField[];
  description?: string;
}

export interface PDFParseResult {
  sections: PDFFormSection[];
  fields: PDFFormField[];
  text: string;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    pages: number;
  };
}

export class PDFParserService {
  /**
   * Parse a PDF file and extract form fields and sections using afpp
   */
  static async parsePDF(file: File): Promise<PDFParseResult> {
    try {
      console.log(
        'Starting PDF parsing for file:',
        file.name,
        'Size:',
        file.size
      );

      // Initialize afpp dynamically
      const unpdf = await initUnpdf();

      // Convert File to Uint8Array for unpdf
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Load PDF document using unpdf
      const pdf = await unpdf.getDocumentProxy(uint8Array);

      // Extract text from PDF
      const textResult = await unpdf.extractText(pdf, { mergePages: true });

      console.log('Unpdf parsing successful, pages:', textResult.totalPages);

      // Extract text content (already merged)
      const fullText = textResult.text;

      // Get PDF metadata for better form title detection
      const metadata = await unpdf.getMeta(pdf);
      console.log('PDF metadata:', metadata);

      // Try to extract title from metadata first
      const metadataTitle =
        metadata.info?.Title || metadata.info?.Subject || metadata.info?.Author;

      // Split text into lines for analysis
      const lines = fullText
        .split('\n')
        .filter((line: string) => line.trim().length > 0);

      // Extract fields and sections from text
      const sections: PDFFormSection[] = [];
      const allFields: PDFFormField[] = [];

      let currentSection: PDFFormSection | null = null;

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Check if line looks like a section header
        if (this.isSectionHeader(trimmedLine, { str: trimmedLine })) {
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            title: trimmedLine,
            fields: [],
          };
        }
        // Check if line looks like a form field
        else if (this.isFormField(trimmedLine, lines, lines.indexOf(line))) {
          const field = this.createFormField(
            trimmedLine,
            lines,
            lines.indexOf(line)
          );
          if (field) {
            allFields.push(field);
            if (currentSection) {
              currentSection.fields.push(field);
            }
          }
        }
      }

      // Add the last section if it exists
      if (currentSection) {
        sections.push(currentSection);
      }

      // If no sections were found, create a default one
      if (sections.length === 0) {
        sections.push({
          title: 'Form Content',
          fields: allFields,
        });
      }

      // Extract title from first few lines
      const title =
        metadataTitle ||
        this.extractFormTitle(lines.map((line: string) => ({ str: line })));

      return {
        sections,
        fields: allFields,
        text: fullText,
        metadata: {
          title: title || file.name,
          pages: textResult.totalPages || 1,
        },
      };
    } catch (error) {
      console.error('Error parsing PDF with unpdf:', error);
      throw new Error(
        'Failed to parse PDF file. Please ensure the file is a valid PDF and try again.'
      );
    }
  }

  /**
   * Check if a line looks like a section header
   */
  private static isSectionHeader(text: string, item: any): boolean {
    const trimmedText = text.trim();

    // Check for common section header patterns
    const sectionPatterns = [
      /^[A-Z\s]+$/, // ALL CAPS
      /^[A-Z][a-z\s]+:$/, // Title Case with colon
      /^[A-Z][a-z\s]+$/, // Title Case
      /^[0-9]+\.\s+[A-Z]/, // Numbered sections
      /^[A-Z][A-Z\s]+[A-Z]$/, // ALL CAPS section
    ];

    return sectionPatterns.some((pattern) => pattern.test(trimmedText));
  }

  /**
   * Check if a line looks like a form field
   */
  private static isFormField(
    text: string,
    items: any[],
    index: number
  ): boolean {
    const trimmedText = text.trim().toLowerCase();

    // Enhanced form field patterns
    const fieldPatterns = [
      // Personal Information
      /name/i,
      /first\s*name/i,
      /last\s*name/i,
      /full\s*name/i,
      /email/i,
      /e-mail/i,
      /email\s*address/i,
      /phone/i,
      /telephone/i,
      /mobile/i,
      /cell/i,
      /contact\s*number/i,
      /address/i,
      /street\s*address/i,
      /city/i,
      /state/i,
      /zip/i,
      /postal\s*code/i,
      /date\s*of\s*birth/i,
      /birth\s*date/i,
      /dob/i,
      /age/i,

      // Professional Information
      /company/i,
      /organization/i,
      /employer/i,
      /business/i,
      /position/i,
      /job\s*title/i,
      /role/i,
      /department/i,
      /salary/i,
      /income/i,
      /annual\s*salary/i,
      /hourly\s*rate/i,
      /experience/i,
      /years\s*of\s*experience/i,
      /work\s*history/i,

      // Education
      /education/i,
      /degree/i,
      /university/i,
      /college/i,
      /school/i,
      /graduation/i,
      /gpa/i,
      /grade\s*point\s*average/i,

      // Medical/Health
      /medical/i,
      /health/i,
      /condition/i,
      /diagnosis/i,
      /symptoms/i,
      /medication/i,
      /prescription/i,
      /allergies/i,
      /blood\s*type/i,

      // Financial
      /account/i,
      /bank/i,
      /credit/i,
      /debit/i,
      /card\s*number/i,
      /ssn/i,
      /social\s*security/i,
      /tax\s*id/i,
      /ein/i,

      // Legal/Consent
      /agree/i,
      /consent/i,
      /signature/i,
      /date\s*signed/i,
      /terms/i,
      /conditions/i,
      /policy/i,
      /waiver/i,

      // Form Controls
      /checkbox/i,
      /radio/i,
      /select/i,
      /option/i,
      /dropdown/i,
      /text\s*box/i,
      /input/i,
      /field/i,
      /area/i,

      // Validation
      /required/i,
      /optional/i,
      /mandatory/i,
      /must\s*complete/i,

      // Common Form Words
      /please\s*provide/i,
      /enter\s*your/i,
      /fill\s*in/i,
      /complete\s*the/i,
      /select\s*one/i,
      /choose/i,
      /indicate/i,
      /specify/i,

      // Special Fields
      /emergency\s*contact/i,
      /reference/i,
      /witness/i,
      /sponsor/i,
      /guarantor/i,
      /co-signer/i,
      /authorized\s*representative/i,
    ];

    // Check for field indicators
    const hasFieldIndicator =
      /[□☐☑☒✓✔✗✘_]{1,3}\s*$/.test(trimmedText) || // Checkboxes, radio buttons
      /\[.*\]/.test(trimmedText) || // Brackets indicating input fields
      /_{3,}/.test(trimmedText) || // Underscores indicating text fields
      /:/.test(trimmedText); // Colons often indicate form fields

    return (
      fieldPatterns.some((pattern) => pattern.test(trimmedText)) ||
      hasFieldIndicator
    );
  }

  /**
   * Create a form field from text
   */
  private static createFormField(
    text: string,
    items: any[],
    index: number
  ): PDFFormField | null {
    const trimmedText = text.trim();
    const lowerText = trimmedText.toLowerCase();

    // Determine field type based on content and visual indicators
    let fieldType: PDFFormField['type'] = 'text';
    let required = false;
    let placeholder = '';
    let options: string[] = [];
    let validation: PDFFormField['validation'] = {};
    let conditional: PDFFormField['conditional'] = {};
    let description = '';
    let helpText = '';
    let defaultValue = '';
    let readonly = false;
    let disabled = false;
    let autocomplete = '';
    let group = '';

    // Check for visual field indicators
    const hasCheckbox = /[□☐☑☒✓✔✗✘]/.test(trimmedText);
    const hasRadio = /[○●]/.test(trimmedText);
    const hasTextArea =
      /_{5,}/.test(trimmedText) ||
      lowerText.includes('address') ||
      lowerText.includes('description');
    const hasDropdown =
      /\[.*\]/.test(trimmedText) ||
      lowerText.includes('select') ||
      lowerText.includes('choose');

    // Enhanced field type detection with more types
    if (
      hasCheckbox ||
      lowerText.includes('checkbox') ||
      lowerText.includes('agree') ||
      lowerText.includes('accept')
    ) {
      fieldType = 'checkbox';
      required = true;
      autocomplete = 'off';
    } else if (
      hasRadio ||
      lowerText.includes('radio') ||
      lowerText.includes('select one') ||
      lowerText.includes('choose one')
    ) {
      fieldType = 'radio';
      options = this.extractSelectOptions(items, index);
      autocomplete = 'off';
    } else if (lowerText.includes('email') || lowerText.includes('e-mail')) {
      fieldType = 'email';
      placeholder = 'Enter your email address';
      autocomplete = 'email';
      validation.pattern = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
    } else if (
      lowerText.includes('phone') ||
      lowerText.includes('telephone') ||
      lowerText.includes('mobile') ||
      lowerText.includes('cell')
    ) {
      fieldType = 'tel';
      placeholder = 'Enter your phone number';
      autocomplete = 'tel';
      validation.pattern = '^[+]?[0-9\\s\\-\\(\\)]{10,}$';
    } else if (
      lowerText.includes('password') ||
      lowerText.includes('pass') ||
      lowerText.includes('pwd')
    ) {
      fieldType = 'password';
      placeholder = 'Enter your password';
      autocomplete = 'current-password';
      validation.minLength = 8;
    } else if (
      lowerText.includes('url') ||
      lowerText.includes('website') ||
      lowerText.includes('link')
    ) {
      fieldType = 'url';
      placeholder = 'https://example.com';
      autocomplete = 'url';
      validation.pattern = '^https?://.+';
    } else if (
      hasTextArea ||
      lowerText.includes('address') ||
      lowerText.includes('description') ||
      lowerText.includes('comments') ||
      lowerText.includes('notes')
    ) {
      fieldType = 'textarea';
      placeholder = 'Enter your response';
      validation.maxLength = 1000;
    } else if (
      lowerText.includes('date') ||
      lowerText.includes('birth') ||
      lowerText.includes('dob')
    ) {
      fieldType = 'date';
      placeholder = 'MM/DD/YYYY';
      validation.format = 'MM/DD/YYYY';
    } else if (
      lowerText.includes('salary') ||
      lowerText.includes('income') ||
      lowerText.includes('amount') ||
      lowerText.includes('number') ||
      lowerText.includes('quantity')
    ) {
      fieldType = 'number';
      placeholder = 'Enter amount';
      validation.min = 0;
      validation.step = 0.01;
    } else if (
      hasDropdown ||
      lowerText.includes('select') ||
      lowerText.includes('choose') ||
      lowerText.includes('pick')
    ) {
      fieldType = 'select';
      options = this.extractSelectOptions(items, index);
      autocomplete = 'off';
    } else if (
      lowerText.includes('file') ||
      lowerText.includes('upload') ||
      lowerText.includes('attachment')
    ) {
      fieldType = 'file';
      placeholder = 'Choose file';
      autocomplete = 'off';
    } else if (lowerText.includes('signature') || lowerText.includes('sign')) {
      fieldType = 'text';
      placeholder = 'Type your name to sign';
      autocomplete = 'name';
    }

    // Extract validation rules
    validation = this.extractValidationRules(trimmedText, validation);

    // Extract conditional logic
    conditional = this.extractConditionalLogic(trimmedText, items, index);

    // Extract help text and description
    const helpInfo = this.extractHelpText(items, index);
    description = helpInfo.description;
    helpText = helpInfo.helpText;

    // Extract default value
    defaultValue = this.extractDefaultValue(trimmedText);

    // Extract field group
    group = this.extractFieldGroup(trimmedText, items, index);

    // Check if field is required
    if (
      lowerText.includes('*') ||
      lowerText.includes('required') ||
      lowerText.includes('mandatory') ||
      lowerText.includes('must')
    ) {
      required = true;
    }

    // Check if field is readonly or disabled
    if (
      lowerText.includes('read only') ||
      lowerText.includes('readonly') ||
      lowerText.includes('display only')
    ) {
      readonly = true;
    }

    if (
      lowerText.includes('disabled') ||
      lowerText.includes('not applicable') ||
      lowerText.includes('n/a')
    ) {
      disabled = true;
    }

    // Generate field name
    const name = trimmedText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .trim();

    return {
      name: name || 'field_' + index,
      type: fieldType,
      label: trimmedText,
      required,
      placeholder: placeholder || undefined,
      options: options.length > 0 ? options : undefined,
      validation:
        validation && Object.keys(validation).length > 0
          ? validation
          : undefined,
      conditional:
        conditional && Object.keys(conditional).length > 0
          ? conditional
          : undefined,
      group: group || undefined,
      order: index,
      description: description || undefined,
      helpText: helpText || undefined,
      defaultValue: defaultValue || undefined,
      readonly: readonly || undefined,
      disabled: disabled || undefined,
      autocomplete: autocomplete || undefined,
    };
  }

  /**
   * Extract select options from surrounding text
   */
  private static extractSelectOptions(
    items: any[],
    currentIndex: number
  ): string[] {
    const options: string[] = [];

    // Look for options in the next few lines
    for (
      let i = currentIndex + 1;
      i < Math.min(currentIndex + 10, items.length);
      i++
    ) {
      const item = items[i];
      const text = item.str?.trim();
      if (!text) continue;

      // Check for common option patterns
      if (
        /^[a-z]\)\s/i.test(text) || // a) option
        /^[0-9]+\.\s/i.test(text) || // 1. option
        /^•\s/i.test(text) || // • option
        /^-\s/i.test(text) || // - option
        /^○\s/i.test(text) || // ○ option
        /^□\s/i.test(text)
      ) {
        // □ option
        const optionText = text.replace(/^[a-z0-9•\-○□]\)?\.?\s*/i, '').trim();
        if (optionText && optionText.length > 0) {
          options.push(optionText);
        }
      }

      // Stop if we hit another field or section
      if (
        this.isFormField(text, items, i) ||
        this.isSectionHeader(text, item)
      ) {
        break;
      }
    }

    return options;
  }

  /**
   * Extract validation rules from field text
   */
  private static extractValidationRules(
    text: string,
    existingValidation: PDFFormField['validation']
  ): PDFFormField['validation'] {
    const validation = { ...existingValidation };
    const lowerText = text.toLowerCase();

    // Extract length constraints
    const minLengthMatch = lowerText.match(
      /(?:min|minimum)\s*(?:length)?\s*:?\s*(\d+)/
    );
    if (minLengthMatch) {
      validation.minLength = parseInt(minLengthMatch[1]);
    }

    const maxLengthMatch = lowerText.match(
      /(?:max|maximum)\s*(?:length)?\s*:?\s*(\d+)/
    );
    if (maxLengthMatch) {
      validation.maxLength = parseInt(maxLengthMatch[1]);
    }

    // Extract numeric constraints
    const minMatch = lowerText.match(/(?:min|minimum)\s*:?\s*(\d+(?:\.\d+)?)/);
    if (minMatch) {
      validation.min = parseFloat(minMatch[1]);
    }

    const maxMatch = lowerText.match(/(?:max|maximum)\s*:?\s*(\d+(?:\.\d+)?)/);
    if (maxMatch) {
      validation.max = parseFloat(maxMatch[1]);
    }

    // Extract step value
    const stepMatch = lowerText.match(
      /(?:step|increment)\s*:?\s*(\d+(?:\.\d+)?)/
    );
    if (stepMatch) {
      validation.step = parseFloat(stepMatch[1]);
    }

    // Extract format patterns
    if (lowerText.includes('format') || lowerText.includes('pattern')) {
      const formatMatch = text.match(/(?:format|pattern)\s*:?\s*([^\s,]+)/i);
      if (formatMatch) {
        validation.format = formatMatch[1];
      }
    }

    return validation;
  }

  /**
   * Extract conditional logic from field text
   */
  private static extractConditionalLogic(
    text: string,
    items: any[],
    currentIndex: number
  ): PDFFormField['conditional'] {
    const conditional: PDFFormField['conditional'] = {};
    const lowerText = text.toLowerCase();

    // Look for conditional keywords in surrounding text
    for (
      let i = Math.max(0, currentIndex - 5);
      i < Math.min(currentIndex + 5, items.length);
      i++
    ) {
      const item = items[i];
      const itemText = item.str?.toLowerCase() || '';

      // Check for dependency patterns
      if (
        itemText.includes('if') ||
        itemText.includes('when') ||
        itemText.includes('depending on')
      ) {
        const dependsMatch = itemText.match(
          /(?:if|when|depending on)\s+([^,\.]+)/
        );
        if (dependsMatch) {
          conditional.dependsOn = dependsMatch[1].trim();
        }
      }

      // Check for show/hide conditions
      if (itemText.includes('show') || itemText.includes('display')) {
        const showMatch = itemText.match(
          /(?:show|display)\s+(?:when|if)\s+([^,\.]+)/
        );
        if (showMatch) {
          conditional.showWhen = showMatch[1].trim();
        }
      }

      if (itemText.includes('hide') || itemText.includes('skip')) {
        const hideMatch = itemText.match(
          /(?:hide|skip)\s+(?:when|if)\s+([^,\.]+)/
        );
        if (hideMatch) {
          conditional.hideWhen = hideMatch[1].trim();
        }
      }
    }

    return conditional;
  }

  /**
   * Extract help text and description from surrounding text
   */
  private static extractHelpText(
    items: any[],
    currentIndex: number
  ): { description: string; helpText: string } {
    let description = '';
    let helpText = '';

    // Look for help text in surrounding lines
    for (
      let i = Math.max(0, currentIndex - 3);
      i < Math.min(currentIndex + 5, items.length);
      i++
    ) {
      const item = items[i];
      const text = item.str?.trim() || '';

      // Skip the current field text
      if (i === currentIndex) continue;

      // Look for description patterns
      if (text.includes('(') && text.includes(')')) {
        const descMatch = text.match(/\(([^)]+)\)/);
        if (descMatch) {
          description = descMatch[1].trim();
        }
      }

      // Look for help text patterns
      if (
        text.includes('help') ||
        text.includes('note') ||
        text.includes('tip')
      ) {
        helpText = text.replace(/(?:help|note|tip)\s*:?\s*/i, '').trim();
      }

      // Look for italicized or smaller text (often help text)
      if (
        text.length > 0 &&
        text.length < 100 &&
        !this.isFormField(text, items, i)
      ) {
        if (!helpText) {
          helpText = text;
        }
      }
    }

    return { description, helpText };
  }

  /**
   * Extract default value from field text
   */
  private static extractDefaultValue(text: string): string {
    const defaultValueMatch = text.match(
      /(?:default|pre-filled|example)\s*:?\s*([^\s,\.]+)/i
    );
    if (defaultValueMatch) {
      return defaultValueMatch[1].trim();
    }

    // Look for values in brackets or parentheses
    const bracketMatch = text.match(/[\[\(]([^\]\)]+)[\]\)]/);
    if (bracketMatch) {
      return bracketMatch[1].trim();
    }

    return '';
  }

  /**
   * Extract field group from surrounding context
   */
  private static extractFieldGroup(
    text: string,
    items: any[],
    currentIndex: number
  ): string {
    // Look backwards for section headers or group indicators
    for (let i = currentIndex - 1; i >= Math.max(0, currentIndex - 10); i--) {
      const item = items[i];
      const itemText = item.str?.trim() || '';

      // Check if this is a section header
      if (this.isSectionHeader(itemText, item)) {
        return itemText;
      }

      // Look for group indicators
      if (
        itemText.includes('group') ||
        itemText.includes('section') ||
        itemText.includes('part')
      ) {
        return itemText;
      }
    }

    return '';
  }

  /**
   * Extract form title from text items
   */
  private static extractFormTitle(textItems: any[]): string | null {
    // Look for title in first few items
    const firstItems = textItems.slice(0, 10);

    for (const item of firstItems) {
      const text = item.str?.trim();
      if (!text) continue;

      // Check for title patterns
      const titlePatterns = [
        /^[A-Z][a-z\s]+Form$/i,
        /^[A-Z][a-z\s]+Application$/i,
        /^[A-Z][a-z\s]+Questionnaire$/i,
        /^[A-Z][a-z\s]+Survey$/i,
        /^[A-Z][a-z\s]+Registration$/i,
      ];

      if (titlePatterns.some((pattern) => pattern.test(text))) {
        return text;
      }
    }

    return null;
  }

  /**
   * Generate a prompt from parsed PDF data
   */
  static generatePromptFromPDF(parseResult: PDFParseResult): string {
    let prompt =
      'Create a comprehensive form based on the following detailed PDF form analysis:\n\n';

    // Add form title
    if (parseResult.metadata.title) {
      prompt += `Form Title: ${parseResult.metadata.title}\n`;
    }

    // Add sections and fields with enhanced details
    if (parseResult.sections.length > 0) {
      prompt += '\nForm Sections:\n';
      parseResult.sections.forEach((section, index) => {
        prompt += `${index + 1}. ${section.title}\n`;
        if (section.fields.length > 0) {
          section.fields.forEach((field) => {
            prompt += this.generateFieldDescription(field, '   ');
          });
        }
      });
    }

    // Add standalone fields
    if (parseResult.sections.length === 0 && parseResult.fields.length > 0) {
      prompt += '\nForm Fields:\n';
      parseResult.fields.forEach((field) => {
        prompt += this.generateFieldDescription(field, '');
      });
    }

    // Add extracted text for context
    if (parseResult.text) {
      prompt += '\nExtracted Text:\n';
      prompt +=
        parseResult.text.substring(0, 500) +
        (parseResult.text.length > 500 ? '...' : '');
    }

    prompt += '\n\nPlease create a form that:';
    prompt += '\n- Matches this exact structure and field types';
    prompt += '\n- Includes all specified validation rules';
    prompt += '\n- Implements conditional logic where indicated';
    prompt += '\n- Uses appropriate HTML5 input types and attributes';
    prompt += '\n- Includes proper accessibility features';
    prompt += '\n- Has responsive design for mobile devices';
    prompt += '\n- Includes helpful placeholder text and descriptions';

    return prompt;
  }

  /**
   * Generate detailed field description for prompt
   */
  private static generateFieldDescription(
    field: PDFFormField,
    indent: string
  ): string {
    let description = `${indent}- ${field.label || field.name} (${field.type})`;

    // Add required indicator
    if (field.required) {
      description += ' *required';
    }

    // Add placeholder
    if (field.placeholder) {
      description += ` - placeholder: "${field.placeholder}"`;
    }

    // Add options for select/radio fields
    if (field.options && field.options.length > 0) {
      description += ` - options: [${field.options.join(', ')}]`;
    }

    // Add validation rules
    if (field.validation) {
      const validationRules: string[] = [];
      if (field.validation.minLength)
        validationRules.push(`min length: ${field.validation.minLength}`);
      if (field.validation.maxLength)
        validationRules.push(`max length: ${field.validation.maxLength}`);
      if (field.validation.min !== undefined)
        validationRules.push(`min: ${field.validation.min}`);
      if (field.validation.max !== undefined)
        validationRules.push(`max: ${field.validation.max}`);
      if (field.validation.step)
        validationRules.push(`step: ${field.validation.step}`);
      if (field.validation.pattern)
        validationRules.push(`pattern: ${field.validation.pattern}`);
      if (field.validation.format)
        validationRules.push(`format: ${field.validation.format}`);

      if (validationRules.length > 0) {
        description += ` - validation: [${validationRules.join(', ')}]`;
      }
    }

    // Add conditional logic
    if (field.conditional) {
      const conditions: string[] = [];
      if (field.conditional.dependsOn)
        conditions.push(`depends on: ${field.conditional.dependsOn}`);
      if (field.conditional.showWhen)
        conditions.push(`show when: ${field.conditional.showWhen}`);
      if (field.conditional.hideWhen)
        conditions.push(`hide when: ${field.conditional.hideWhen}`);

      if (conditions.length > 0) {
        description += ` - conditional: [${conditions.join(', ')}]`;
      }
    }

    // Add group information
    if (field.group) {
      description += ` - group: "${field.group}"`;
    }

    // Add description and help text
    if (field.description) {
      description += ` - description: "${field.description}"`;
    }

    if (field.helpText) {
      description += ` - help: "${field.helpText}"`;
    }

    // Add default value
    if (field.defaultValue) {
      description += ` - default: "${field.defaultValue}"`;
    }

    // Add field state
    if (field.readonly) {
      description += ' - readonly';
    }

    if (field.disabled) {
      description += ' - disabled';
    }

    // Add autocomplete
    if (field.autocomplete) {
      description += ` - autocomplete: ${field.autocomplete}`;
    }

    description += '\n';
    return description;
  }
}
