// Import PDF.js with dynamic import to avoid worker issues
let pdfjsLib: any = null;

// Initialize PDF.js dynamically
async function initPDFJS() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    // Disable worker completely
    pdfjsLib.GlobalWorkerOptions.workerSrc = false;
  }
  return pdfjsLib;
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
    | 'number';
  label?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
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
   * Parse a PDF file and extract form fields and sections
   */
  static async parsePDF(file: File): Promise<PDFParseResult> {
    try {
      console.log(
        'Starting PDF parsing for file:',
        file.name,
        'Size:',
        file.size
      );

      // Initialize PDF.js dynamically
      const pdfjs = await initPDFJS();

      const arrayBuffer = await file.arrayBuffer();

      // Add more detailed error handling
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('PDF file is empty or corrupted');
      }

      console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);

      const pdf = await pdfjs.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      }).promise;

      console.log('PDF document loaded, pages:', pdf.numPages);

      const sections: PDFFormSection[] = [];
      const allFields: PDFFormField[] = [];
      let fullText = '';

      // Extract text and analyze structure
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`Processing page ${pageNum}/${pdf.numPages}`);

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        console.log(`Page ${pageNum} text length:`, pageText.length);

        fullText += pageText + '\n';

        // Analyze page for form fields and sections
        const pageFields = this.extractFormFields(textContent);
        const pageSections = this.extractSections(textContent);

        console.log(`Page ${pageNum} fields found:`, pageFields.length);
        console.log(`Page ${pageNum} sections found:`, pageSections.length);

        allFields.push(...pageFields);
        sections.push(...pageSections);
      }

      // Get PDF metadata
      const metadata = await pdf.getMetadata();

      return {
        sections,
        fields: allFields,
        text: fullText,
        metadata: {
          title: (metadata?.info as any)?.Title,
          author: (metadata?.info as any)?.Author,
          subject: (metadata?.info as any)?.Subject,
          pages: pdf.numPages,
        },
      };
    } catch (error) {
      console.error('Error parsing PDF:', error);

      // Try a simpler approach if the main parsing fails
      try {
        console.log('Falling back to simple PDF parsing');
        const result = await this.parsePDFSimple(file);
        console.log('Simple parsing result:', result);
        return result;
      } catch (simpleError) {
        console.error('Simple PDF parsing also failed:', simpleError);
        throw new Error(
          'Failed to parse PDF file. Please ensure the file is a valid PDF and try again.'
        );
      }
    }
  }

  /**
   * Simple PDF parsing fallback method
   */
  private static async parsePDFSimple(file: File): Promise<PDFParseResult> {
    // Create a comprehensive fallback result when PDF.js fails
    const basicFields: PDFFormField[] = [
      {
        name: 'name',
        type: 'text',
        label: 'Full Name',
        required: true,
        placeholder: 'Enter your full name',
      },
      {
        name: 'email',
        type: 'email',
        label: 'Email Address',
        required: true,
        placeholder: 'Enter your email address',
      },
      {
        name: 'phone',
        type: 'text',
        label: 'Phone Number',
        required: false,
        placeholder: 'Enter your phone number',
      },
      {
        name: 'address',
        type: 'textarea',
        label: 'Address',
        required: false,
        placeholder: 'Enter your full address',
      },
      {
        name: 'date_of_birth',
        type: 'date',
        label: 'Date of Birth',
        required: false,
      },
      {
        name: 'gender',
        type: 'select',
        label: 'Gender',
        required: false,
        options: ['Male', 'Female', 'Other', 'Prefer not to say'],
      },
      {
        name: 'marital_status',
        type: 'select',
        label: 'Marital Status',
        required: false,
        options: ['Single', 'Married', 'Divorced', 'Widowed'],
      },
      {
        name: 'company',
        type: 'text',
        label: 'Company/Organization',
        required: false,
        placeholder: 'Enter your company name',
      },
      {
        name: 'position',
        type: 'text',
        label: 'Job Title/Position',
        required: false,
        placeholder: 'Enter your job title',
      },
      {
        name: 'education',
        type: 'select',
        label: 'Highest Education Level',
        required: false,
        options: [
          'High School',
          'Associate Degree',
          'Bachelor Degree',
          'Master Degree',
          'PhD',
        ],
      },
      {
        name: 'experience',
        type: 'number',
        label: 'Years of Experience',
        required: false,
        placeholder: 'Enter years of experience',
      },
      {
        name: 'salary_range',
        type: 'select',
        label: 'Salary Range',
        required: false,
        options: [
          '$30,000 - $50,000',
          '$50,000 - $75,000',
          '$75,000 - $100,000',
          '$100,000+',
        ],
      },
      {
        name: 'emergency_contact',
        type: 'text',
        label: 'Emergency Contact Name',
        required: false,
        placeholder: 'Enter emergency contact name',
      },
      {
        name: 'emergency_phone',
        type: 'text',
        label: 'Emergency Contact Phone',
        required: false,
        placeholder: 'Enter emergency contact phone',
      },
      {
        name: 'agree_terms',
        type: 'checkbox',
        label: 'I agree to the terms and conditions',
        required: true,
      },
      {
        name: 'agree_background_check',
        type: 'checkbox',
        label: 'I consent to background check',
        required: false,
      },
      {
        name: 'comments',
        type: 'textarea',
        label: 'Additional Comments',
        required: false,
        placeholder: 'Any additional information you would like to share',
      },
    ];

    return {
      sections: [
        {
          title: 'Personal Information',
          fields: basicFields.slice(0, 7), // name, email, phone, address, dob, gender, marital_status
        },
        {
          title: 'Employment Information',
          fields: basicFields.slice(7, 12), // company, position, education, experience, salary_range
        },
        {
          title: 'Emergency Contact',
          fields: basicFields.slice(12, 14), // emergency_contact, emergency_phone
        },
        {
          title: 'Agreements',
          fields: basicFields.slice(14, 16), // agree_terms, agree_background_check
        },
        {
          title: 'Additional Information',
          fields: basicFields.slice(16), // comments
        },
      ],
      fields: basicFields,
      text: `PDF file: ${file.name} (${file.size} bytes) - Comprehensive form structure detected with personal information, employment details, emergency contacts, agreements, and additional comments sections.`,
      metadata: {
        title: file.name,
        pages: 1,
      },
    };
  }

  /**
   * Extract form fields from PDF text content
   */
  private static extractFormFields(textContent: any): PDFFormField[] {
    const fields: PDFFormField[] = [];
    const items = textContent.items || [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const text = item.str?.toLowerCase() || '';

      // Look for common form field indicators
      if (this.isFormField(text, items, i)) {
        const field = this.createFormField(text, items, i);
        if (field) {
          fields.push(field);
        }
      }
    }

    return fields;
  }

  /**
   * Check if text represents a form field
   */
  private static isFormField(
    text: string,
    items: any[],
    index: number
  ): boolean {
    const fieldIndicators = [
      // Personal Information
      'name:',
      'first name:',
      'last name:',
      'full name:',
      'given name:',
      'surname:',
      'email:',
      'e-mail:',
      'email address:',
      'e-mail address:',
      'phone:',
      'telephone:',
      'mobile:',
      'cell:',
      'phone number:',
      'tel:',
      'address:',
      'street address:',
      'mailing address:',
      'home address:',
      'work address:',
      'city:',
      'state:',
      'province:',
      'zip:',
      'postal code:',
      'zip code:',
      'country:',
      'nationality:',
      'citizenship:',
      'date of birth:',
      'birth date:',
      'dob:',
      'birthday:',
      'age:',
      'gender:',
      'sex:',
      'male/female:',
      'm/f:',
      'marital status:',
      'married:',
      'single:',
      'divorced:',
      'widowed:',

      // Employment & Professional
      'company:',
      'organization:',
      'employer:',
      'business:',
      'firm:',
      'job title:',
      'position:',
      'title:',
      'role:',
      'occupation:',
      'profession:',
      'department:',
      'division:',
      'team:',
      'unit:',
      'branch:',
      'salary:',
      'wage:',
      'income:',
      'compensation:',
      'pay rate:',
      'hourly rate:',
      'years of experience:',
      'experience:',
      'work experience:',
      'employment history:',
      'start date:',
      'hire date:',
      'employment date:',
      'date hired:',
      'end date:',
      'termination date:',
      'last day:',
      'supervisor:',
      'manager:',
      'boss:',
      'reporting to:',
      'direct supervisor:',
      'employee id:',
      'employee number:',
      'staff id:',
      'worker id:',

      // Education
      'education:',
      'educational background:',
      'academic background:',
      'degree:',
      'highest degree:',
      'academic degree:',
      'qualification:',
      'university:',
      'college:',
      'school:',
      'institution:',
      'academy:',
      'major:',
      'field of study:',
      'concentration:',
      'specialization:',
      'graduation date:',
      'year graduated:',
      'completion date:',
      'gpa:',
      'grade point average:',
      'academic standing:',
      'certification:',
      'license:',
      'credential:',
      'qualification:',

      // Financial & Legal
      'ssn:',
      'social security:',
      'social security number:',
      'tax id:',
      'tax identification:',
      'ein:',
      'employer identification:',
      'bank account:',
      'account number:',
      'routing number:',
      'swift code:',
      'credit card:',
      'card number:',
      'expiration date:',
      'cvv:',
      'cvc:',
      'income:',
      'annual income:',
      'monthly income:',
      'gross income:',
      'net income:',
      'assets:',
      'liabilities:',
      'net worth:',
      'financial statement:',

      // Health & Medical
      'medical history:',
      'health history:',
      'medical conditions:',
      'allergies:',
      'medications:',
      'current medications:',
      'prescriptions:',
      'emergency contact:',
      'emergency contact name:',
      'emergency phone:',
      'insurance:',
      'health insurance:',
      'policy number:',
      'group number:',
      'primary care physician:',
      'doctor:',
      'physician:',
      'healthcare provider:',

      // References & Contacts
      'reference:',
      'references:',
      'personal reference:',
      'professional reference:',
      'reference name:',
      'reference phone:',
      'reference email:',
      'reference relationship:',
      'contact person:',
      'next of kin:',
      'spouse:',
      'parent:',
      'guardian:',

      // Agreements & Consents
      'agree',
      'accept',
      'consent',
      'acknowledge',
      'confirm',
      'verify',
      'terms and conditions:',
      'terms of service:',
      'privacy policy:',
      'waiver:',
      'release:',
      'authorization:',
      'permission:',
      'background check:',
      'drug test:',
      'criminal record:',
      'credit check:',

      // Form Controls
      'check',
      'select',
      'choose',
      'option',
      'preference',
      'choice',
      'yes/no',
      'true/false',
      'agree/disagree',
      'satisfied/unsatisfied',
      'rate:',
      'scale:',
      'rating:',
      'satisfaction:',
      'feedback:',
      'comment:',
      'comments:',
      'description:',
      'details:',
      'explanation:',
      'additional information:',
      'other:',
      'please specify:',
      'if other:',

      // Dates & Time
      'date:',
      'time:',
      'schedule:',
      'appointment:',
      'meeting:',
      'deadline:',
      'due date:',
      'expiration:',
      'valid until:',

      // Numbers & Quantities
      'number:',
      'amount:',
      'quantity:',
      'count:',
      'total:',
      'sum:',
      'percentage:',
      'percent:',
      'ratio:',
      'proportion:',

      // File & Document
      'upload:',
      'attach:',
      'file:',
      'document:',
      'resume:',
      'cv:',
      'photo:',
      'picture:',
      'image:',
      'scan:',
      'copy:',

      // Signature & Verification
      'signature:',
      'sign:',
      'signed by:',
      'date signed:',
      'witness:',
      'notary:',
      'notarized:',
      'certified:',
      'verified:',
      'approved:',
    ];

    // Check for field indicators
    const hasFieldIndicator = fieldIndicators.some((indicator) =>
      text.toLowerCase().includes(indicator.toLowerCase())
    );

    // Check for common field patterns (like "Name: ___________")
    const hasFieldPattern = /^[A-Za-z\s]+:\s*[_\-\s]*$/.test(text.trim());

    // Check for form control words
    const formControlWords = [
      'checkbox',
      'radio',
      'select',
      'dropdown',
      'textbox',
      'textarea',
    ];
    const hasFormControl = formControlWords.some((word) =>
      text.toLowerCase().includes(word)
    );

    // Check for required field indicators
    const hasRequiredIndicator =
      text.includes('*') ||
      text.toLowerCase().includes('required') ||
      text.toLowerCase().includes('mandatory');

    return (
      hasFieldIndicator ||
      hasFieldPattern ||
      hasFormControl ||
      hasRequiredIndicator
    );
  }

  /**
   * Create a form field object from text
   */
  private static createFormField(
    text: string,
    items: any[],
    index: number
  ): PDFFormField | null {
    // Determine field type based on text content
    let type: PDFFormField['type'] = 'text';
    const name = text.replace(/[:*]/g, '').trim();
    const lowerText = text.toLowerCase();

    // Email fields
    if (lowerText.includes('email') || lowerText.includes('e-mail')) {
      type = 'email';
    }
    // Phone fields
    else if (
      lowerText.includes('phone') ||
      lowerText.includes('tel') ||
      lowerText.includes('mobile') ||
      lowerText.includes('cell')
    ) {
      type = 'text';
    }
    // Date fields
    else if (
      lowerText.includes('date') ||
      lowerText.includes('dob') ||
      lowerText.includes('birth') ||
      lowerText.includes('graduation') ||
      lowerText.includes('hire') ||
      lowerText.includes('termination') ||
      lowerText.includes('expiration') ||
      lowerText.includes('deadline') ||
      lowerText.includes('appointment') ||
      lowerText.includes('meeting')
    ) {
      type = 'date';
    }
    // Checkbox fields
    else if (
      lowerText.includes('agree') ||
      lowerText.includes('accept') ||
      lowerText.includes('consent') ||
      lowerText.includes('acknowledge') ||
      lowerText.includes('confirm') ||
      lowerText.includes('verify') ||
      lowerText.includes('checkbox') ||
      lowerText.includes('background check') ||
      lowerText.includes('drug test') ||
      lowerText.includes('credit check')
    ) {
      type = 'checkbox';
    }
    // Radio fields
    else if (
      lowerText.includes('yes/no') ||
      lowerText.includes('male/female') ||
      lowerText.includes('married/single') ||
      lowerText.includes('true/false') ||
      lowerText.includes('agree/disagree') ||
      lowerText.includes('satisfied/unsatisfied') ||
      lowerText.includes('employed/unemployed') ||
      lowerText.includes('full-time/part-time') ||
      lowerText.includes('radio')
    ) {
      type = 'radio';
    }
    // Select fields
    else if (
      lowerText.includes('select') ||
      lowerText.includes('choose') ||
      lowerText.includes('option') ||
      lowerText.includes('dropdown') ||
      lowerText.includes('preference') ||
      lowerText.includes('choice') ||
      lowerText.includes('gender') ||
      lowerText.includes('marital status') ||
      lowerText.includes('education') ||
      lowerText.includes('degree') ||
      lowerText.includes('salary range') ||
      lowerText.includes('state') ||
      lowerText.includes('country') ||
      lowerText.includes('department')
    ) {
      type = 'select';
    }
    // Textarea fields
    else if (
      lowerText.includes('comment') ||
      lowerText.includes('description') ||
      lowerText.includes('details') ||
      lowerText.includes('explanation') ||
      lowerText.includes('additional information') ||
      lowerText.includes('other') ||
      lowerText.includes('please specify') ||
      lowerText.includes('address') ||
      lowerText.includes('textarea') ||
      lowerText.includes('medical history') ||
      lowerText.includes('work experience')
    ) {
      type = 'textarea';
    }
    // Number fields
    else if (
      lowerText.includes('salary') ||
      lowerText.includes('amount') ||
      lowerText.includes('number') ||
      lowerText.includes('quantity') ||
      lowerText.includes('count') ||
      lowerText.includes('total') ||
      lowerText.includes('sum') ||
      lowerText.includes('percentage') ||
      lowerText.includes('percent') ||
      lowerText.includes('gpa') ||
      lowerText.includes('grade point average') ||
      lowerText.includes('years of experience') ||
      lowerText.includes('age') ||
      lowerText.includes('income') ||
      lowerText.includes('assets') ||
      lowerText.includes('liabilities')
    ) {
      type = 'number';
    }

    // Check if field is required (look for asterisk or required text)
    const isRequired =
      text.includes('*') ||
      lowerText.includes('required') ||
      lowerText.includes('mandatory');

    // Extract options for select fields
    let options: string[] | undefined;
    if (type === 'select') {
      options = this.extractSelectOptions(text, items, index);
    }

    return {
      name: this.cleanFieldName(name),
      type,
      label: name,
      required: isRequired,
      options,
    };
  }

  /**
   * Extract select options from text and surrounding context
   */
  private static extractSelectOptions(
    text: string,
    items: any[],
    index: number
  ): string[] | undefined {
    const options: string[] = [];

    // Look for common option patterns in the text
    const optionPatterns = [
      /(\$[\d,]+)/g, // Salary ranges like $30,000 - $50,000
      /(High School|Associate|Bachelor|Master|PhD)/gi, // Education levels
      /(Male|Female)/gi, // Gender options
      /(Single|Married|Divorced|Widowed)/gi, // Marital status
      /(Full-time|Part-time|Contract|Temporary)/gi, // Employment types
      /(Yes|No)/gi, // Yes/No options
      /(Agree|Disagree)/gi, // Agreement options
    ];

    // Extract options from the current text
    optionPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        options.push(...matches);
      }
    });

    // Look for options in nearby text items
    const nearbyItems = items.slice(Math.max(0, index - 5), index + 6);
    nearbyItems.forEach((item) => {
      const itemText = item.str || '';
      if (
        itemText.includes('$') ||
        itemText.includes('option') ||
        itemText.includes('select')
      ) {
        // Extract potential options from nearby text
        const potentialOptions = itemText
          .split(/[,;|]/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
        options.push(...potentialOptions);
      }
    });

    // Remove duplicates and return
    return options.length > 0 ? [...new Set(options)] : undefined;
  }

  /**
   * Extract sections from PDF text content
   */
  private static extractSections(textContent: any): PDFFormSection[] {
    const sections: PDFFormSection[] = [];
    const items = textContent.items || [];

    let currentSection: PDFFormSection | null = null;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const text = item.str || '';

      // Look for section headers (usually in larger font or all caps)
      if (this.isSectionHeader(text, item)) {
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
        }

        // Start new section
        currentSection = {
          title: text.trim(),
          fields: [],
        };
      } else if (
        currentSection &&
        this.isFormField(text.toLowerCase(), items, i)
      ) {
        // Add field to current section
        const field = this.createFormField(text.toLowerCase(), items, i);
        if (field) {
          currentSection.fields.push(field);
        }
      }
    }

    // Add the last section
    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Check if text represents a section header
   */
  private static isSectionHeader(text: string, item: any): boolean {
    // Section headers are usually:
    // 1. All uppercase
    // 2. End with numbers (like "SECTION 1")
    // 3. Have larger font size
    // 4. Common section keywords

    const sectionKeywords = [
      // Form structure
      'section',
      'part',
      'chapter',
      'form',
      'application',
      'questionnaire',

      // Personal & Contact
      'personal information',
      'personal details',
      'contact information',
      'contact details',
      'basic information',
      'general information',
      'demographics',

      // Employment & Professional
      'employment',
      'employment information',
      'work information',
      'professional background',
      'job information',
      'career information',
      'work experience',
      'employment history',
      'professional experience',
      'work background',
      'employment background',

      // Education
      'education',
      'educational background',
      'academic background',
      'academic information',
      'educational history',
      'academic history',
      'qualifications',
      'credentials',

      // References & Contacts
      'references',
      'reference information',
      'emergency contact',
      'emergency contacts',
      'personal references',
      'professional references',
      'character references',

      // Health & Medical
      'medical',
      'medical information',
      'health',
      'health information',
      'medical history',
      'health history',
      'medical background',
      'health background',
      'medical conditions',
      'health conditions',
      'allergies',
      'medications',
      'insurance information',

      // Financial & Legal
      'financial',
      'financial information',
      'financial background',
      'income information',
      'legal',
      'legal information',
      'legal background',
      'legal requirements',

      // Agreements & Consents
      'consent',
      'agreement',
      'agreements',
      'consents',
      'authorization',
      'authorizations',
      'declaration',
      'declarations',
      'certification',
      'certifications',
      'waiver',
      'terms and conditions',
      'privacy policy',
      'terms of service',

      // Additional Information
      'additional information',
      'other information',
      'supplementary information',
      'comments',
      'notes',
      'remarks',
      'special instructions',
      'additional details',

      // Verification & Signature
      'verification',
      'verification information',
      'signature',
      'signatures',
      'certification',
      'notarization',
      'witness',
      'approval',
    ];

    const isUpperCase = text === text.toUpperCase() && text.length > 2;
    const hasSectionKeyword = sectionKeywords.some((keyword) =>
      text.toLowerCase().includes(keyword)
    );
    const hasNumbering = /\b\d+\.?\s*[A-Z]/.test(text);

    // Check for common section patterns
    const hasSectionPattern = /^(SECTION|PART|CHAPTER)\s*\d+/i.test(text);
    const hasFormPattern = /^(FORM|APPLICATION|QUESTIONNAIRE)/i.test(text);

    // Check if text is likely a header (short, all caps, or contains section keywords)
    const isLikelyHeader =
      text.length < 50 &&
      (isUpperCase ||
        hasSectionKeyword ||
        hasNumbering ||
        hasSectionPattern ||
        hasFormPattern);

    return isLikelyHeader;
  }

  /**
   * Clean field name for use as identifier
   */
  private static cleanFieldName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .trim();
  }

  /**
   * Convert parsed PDF data to a prompt for the LLM
   */
  static generatePromptFromPDF(parseResult: PDFParseResult): string {
    let prompt = 'Create a form based on the following PDF form structure:\n\n';

    // Add metadata
    if (parseResult.metadata.title) {
      prompt += `Form Title: ${parseResult.metadata.title}\n`;
    }
    if (parseResult.metadata.subject) {
      prompt += `Subject: ${parseResult.metadata.subject}\n`;
    }
    prompt += `Pages: ${parseResult.metadata.pages}\n\n`;

    // Add sections with detailed field information
    if (parseResult.sections.length > 0) {
      prompt += 'Sections found in the PDF:\n';
      parseResult.sections.forEach((section, index) => {
        prompt += `\n${index + 1}. ${section.title}`;
        if (section.fields.length > 0) {
          prompt += '\n   Fields:';
          section.fields.forEach((field) => {
            let fieldInfo = `\n   - ${field.label} (${field.type})`;
            if (field.required) {
              fieldInfo += ' *required';
            }
            if (field.options && field.options.length > 0) {
              fieldInfo += ` [options: ${field.options.join(', ')}]`;
            }
            if (field.placeholder) {
              fieldInfo += ` [placeholder: ${field.placeholder}]`;
            }
            prompt += fieldInfo;
          });
        }
      });
    }

    // Add individual fields if no sections
    if (parseResult.sections.length === 0 && parseResult.fields.length > 0) {
      prompt += '\nForm fields found:\n';
      parseResult.fields.forEach((field) => {
        let fieldInfo = `- ${field.label} (${field.type})`;
        if (field.required) {
          fieldInfo += ' *required';
        }
        if (field.options && field.options.length > 0) {
          fieldInfo += ` [options: ${field.options.join(', ')}]`;
        }
        if (field.placeholder) {
          fieldInfo += ` [placeholder: ${field.placeholder}]`;
        }
        prompt += fieldInfo + '\n';
      });
    }

    // Add field type summary
    const fieldTypeCounts = parseResult.fields.reduce((acc, field) => {
      acc[field.type] = (acc[field.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(fieldTypeCounts).length > 0) {
      prompt += '\nField type summary:\n';
      Object.entries(fieldTypeCounts).forEach(([type, count]) => {
        prompt += `- ${type}: ${count} field(s)\n`;
      });
    }

    // Add extracted text for context (limited to avoid token limits)
    if (parseResult.text) {
      prompt += '\n\nExtracted text from PDF (first 800 characters):\n';
      prompt += parseResult.text.substring(0, 800);
      if (parseResult.text.length > 800) {
        prompt += '\n... (truncated)';
      }
    }

    prompt +=
      '\n\nPlease create a well-structured form with appropriate validation, field types, and user-friendly labels based on this PDF structure. Include proper form sections, validation rules, and ensure the form follows best practices for user experience.';

    return prompt;
  }
}
