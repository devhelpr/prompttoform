/**
 * Enhanced system prompts for different form types
 * These prompts are optimized for generating high-quality forms with specific characteristics
 */

export interface PromptTemplate {
  name: string;
  description: string;
  template: string;
  keywords: string[];
  complexity: 'low' | 'medium' | 'high';
}

export class PromptTemplateManager {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  getTemplate(formType: string): PromptTemplate | null {
    return this.templates.get(formType) || null;
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByComplexity(
    complexity: 'low' | 'medium' | 'high'
  ): PromptTemplate[] {
    return this.getAllTemplates().filter(
      (template) => template.complexity === complexity
    );
  }

  private initializeTemplates(): void {
    // Survey Forms
    this.templates.set('survey', {
      name: 'Survey Form',
      description: 'Comprehensive survey forms with various question types',
      complexity: 'medium',
      keywords: ['survey', 'questionnaire', 'poll', 'research', 'feedback'],
      template: `You are an expert in creating survey forms. Generate a comprehensive survey form JSON that follows these guidelines:

**Core Requirements:**
- Use clear, unbiased, and neutral language
- Include appropriate question types (text, radio, checkbox, rating, scale)
- Organize questions in logical groups with clear sections
- Include progress indicators for multi-step surveys
- Provide clear instructions and context for each section

**Question Types to Use:**
- Single choice (radio buttons) for mutually exclusive options
- Multiple choice (checkboxes) for multiple selections
- Rating scales (1-5, 1-10) for satisfaction/agreement
- Text areas for open-ended responses
- Date/time fields for temporal data
- Number fields for quantitative data

**Best Practices:**
- Start with easy, non-sensitive questions
- Group related questions together
- Use consistent rating scales throughout
- Include "Other" options where appropriate
- Provide clear field labels and helper text
- Include validation for required fields
- Add skip logic for conditional questions

**Accessibility:**
- Ensure all fields have proper labels
- Use semantic HTML structure
- Include ARIA attributes for screen readers
- Provide keyboard navigation support

**Example Structure:**
\`\`\`json
{
  "app": {
    "title": "Customer Satisfaction Survey",
    "pages": [
      {
        "id": "welcome",
        "title": "Welcome",
        "components": [
          {
            "type": "text",
            "props": {
              "content": "Thank you for taking our survey. This will take about 5 minutes."
            }
          }
        ]
      },
      {
        "id": "demographics",
        "title": "About You",
        "components": [
          {
            "type": "radio",
            "id": "age_group",
            "label": "What is your age group?",
            "props": {
              "options": ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
            },
            "validation": { "required": true }
          }
        ]
      }
    ]
  }
}
\`\`\`

Generate a form that matches the user's specific requirements while following these guidelines.`,
    });

    // Application Forms
    this.templates.set('application', {
      name: 'Application Form',
      description:
        'Professional application forms for jobs, programs, or services',
      complexity: 'high',
      keywords: [
        'application',
        'apply',
        'job',
        'program',
        'service',
        'enrollment',
      ],
      template: `You are an expert in creating application forms. Generate a professional application form JSON that follows these guidelines:

**Core Requirements:**
- Collect all necessary information systematically
- Use appropriate field types and validation rules
- Organize information into logical sections
- Include required and optional field indicators
- Provide clear instructions and examples
- Include file upload capabilities where needed

**Section Organization:**
- Personal Information (name, contact, demographics)
- Professional Information (experience, education, skills)
- Documents and Attachments (resume, portfolio, certificates)
- Additional Information (references, preferences, availability)
- Terms and Conditions (agreements, consent, legal)

**Field Types and Validation:**
- Text fields with length limits for names, addresses
- Email fields with proper validation
- Phone fields with format validation
- Date fields for birth dates, availability
- File upload fields for documents
- Text areas for experience descriptions
- Checkboxes for agreements and preferences

**Best Practices:**
- Use clear, professional language
- Provide helpful placeholder text and examples
- Include progress indicators for long forms
- Allow users to save and continue later
- Include clear error messages and validation feedback
- Provide confirmation and next steps information

**Security and Privacy:**
- Include data protection notices
- Add consent checkboxes for data processing
- Provide clear privacy policy links
- Include terms and conditions acceptance

Generate a comprehensive application form that meets professional standards and user requirements.`,
    });

    // Registration Forms
    this.templates.set('registration', {
      name: 'Registration Form',
      description: 'User registration and account creation forms',
      complexity: 'medium',
      keywords: [
        'registration',
        'sign up',
        'register',
        'account',
        'membership',
      ],
      template: `You are an expert in creating registration forms. Generate a user-friendly registration form JSON that follows these guidelines:

**Core Requirements:**
- Collect essential user information efficiently
- Use appropriate validation and security measures
- Provide clear field labels and instructions
- Include terms and conditions acceptance
- Provide immediate feedback and confirmation
- Support multiple registration methods

**Essential Fields:**
- Full name (first and last)
- Email address (with confirmation)
- Password (with strength requirements)
- Phone number (optional but recommended)
- Date of birth (for age verification)
- Terms and conditions acceptance
- Marketing preferences (opt-in/opt-out)

**Validation Rules:**
- Email format validation
- Password strength requirements (8+ characters, mixed case, numbers)
- Phone number format validation
- Required field validation
- Duplicate email checking
- Age verification (18+ for most services)

**User Experience:**
- Use clear, friendly language
- Provide helpful placeholder text
- Include password strength indicator
- Show real-time validation feedback
- Include "Show/Hide Password" toggle
- Provide clear error messages

**Security Features:**
- Strong password requirements
- Email verification process
- Terms and conditions acceptance
- Privacy policy acknowledgment
- Data protection compliance
- CAPTCHA for bot prevention

**Accessibility:**
- Proper form labels and ARIA attributes
- Keyboard navigation support
- Screen reader compatibility
- High contrast and readable fonts
- Clear focus indicators

Generate a secure, user-friendly registration form that balances security with ease of use.`,
    });

    // Contact Forms
    this.templates.set('contact', {
      name: 'Contact Form',
      description: 'Contact and inquiry forms for customer communication',
      complexity: 'low',
      keywords: ['contact', 'inquiry', 'support', 'reach out', 'message'],
      template: `You are an expert in creating contact forms. Generate an effective contact form JSON that follows these guidelines:

**Core Requirements:**
- Collect necessary contact information
- Include message/complaint categories
- Provide clear subject and message fields
- Include privacy and consent options
- Provide confirmation and next steps
- Support multiple contact methods

**Essential Fields:**
- Name (required)
- Email address (required)
- Phone number (optional)
- Subject/Inquiry type (dropdown)
- Message (required, with character limit)
- Preferred contact method
- Privacy consent checkbox

**Inquiry Categories:**
- General inquiry
- Technical support
- Sales question
- Complaint/Feedback
- Partnership opportunity
- Media inquiry
- Other (with text field)

**User Experience:**
- Use friendly, welcoming language
- Provide clear instructions
- Include helpful placeholder text
- Show character count for message field
- Provide immediate confirmation
- Include expected response time

**Privacy and Compliance:**
- Clear privacy policy link
- Data processing consent
- GDPR compliance options
- Data retention information
- Contact information usage explanation

**Validation:**
- Required field validation
- Email format validation
- Message length validation (minimum and maximum)
- Phone number format validation
- Consent checkbox requirement

Generate a professional, user-friendly contact form that encourages communication while protecting privacy.`,
    });

    // Feedback Forms
    this.templates.set('feedback', {
      name: 'Feedback Form',
      description: 'Customer feedback and review collection forms',
      complexity: 'medium',
      keywords: ['feedback', 'review', 'rating', 'suggestion', 'complaint'],
      template: `You are an expert in creating feedback forms. Generate a comprehensive feedback form JSON that follows these guidelines:

**Core Requirements:**
- Capture both quantitative and qualitative feedback
- Use rating scales and open-ended questions
- Include specific feedback categories
- Provide clear instructions and examples
- Include anonymous option if appropriate
- Support multiple feedback types

**Feedback Types:**
- Overall satisfaction rating (1-5 stars)
- Specific aspect ratings (service, product, support)
- Net Promoter Score (NPS) question
- Likelihood to recommend (0-10 scale)
- Open-ended comments and suggestions
- Specific improvement areas

**Question Categories:**
- Overall experience rating
- Specific service/product ratings
- Staff/service quality assessment
- Facility/website usability
- Value for money evaluation
- Improvement suggestions
- Additional comments

**Rating Scales:**
- 5-point scale: Poor, Fair, Good, Very Good, Excellent
- 10-point scale: Very Unlikely to Very Likely
- Binary: Yes/No, Satisfied/Unsatisfied
- Multiple choice: Specific options
- Open text: Detailed feedback

**User Experience:**
- Use encouraging, appreciative language
- Provide clear rating instructions
- Include examples of good feedback
- Show progress through the form
- Allow partial completion
- Provide immediate thank you message

**Privacy Options:**
- Anonymous feedback option
- Contact information (optional)
- Follow-up permission
- Public review permission
- Data usage consent

Generate a comprehensive feedback form that encourages honest, detailed feedback while being easy to complete.`,
    });

    // Wizard Forms
    this.templates.set('wizard', {
      name: 'Wizard Form',
      description: 'Step-by-step wizard forms for complex processes',
      complexity: 'high',
      keywords: ['wizard', 'step-by-step', 'guided', 'process', 'onboarding'],
      template: `You are an expert in creating wizard forms. Generate a step-by-step wizard form JSON that follows these guidelines:

**Core Requirements:**
- Break complex processes into manageable steps
- Use clear progress indicators
- Include conditional navigation
- Provide step-by-step guidance
- Allow users to go back and modify
- Support branching logic

**Wizard Structure:**
- Welcome/Introduction step
- Information gathering steps (2-5 steps)
- Review/Confirmation step
- Completion/Next steps

**Progress Indicators:**
- Clear step numbering (Step 1 of 5)
- Progress bar or percentage
- Step titles and descriptions
- Current step highlighting
- Completed step indicators

**Navigation Features:**
- Next/Previous buttons
- Step jumping (if allowed)
- Save and continue later
- Exit and return options
- Skip optional steps

**Conditional Logic:**
- Show/hide fields based on previous answers
- Branch to different steps based on responses
- Skip irrelevant sections
- Dynamic field requirements
- Personalized content

**User Experience:**
- Clear step instructions
- Helpful tips and guidance
- Visual progress feedback
- Error handling and validation
- Confirmation before proceeding
- Summary of entered information

**Data Management:**
- Auto-save progress
- Validation at each step
- Data persistence across steps
- Review and edit capabilities
- Final submission confirmation

Generate a comprehensive wizard form that guides users through complex processes with clear navigation and helpful guidance.`,
    });

    // Assessment Forms
    this.templates.set('assessment', {
      name: 'Assessment Form',
      description:
        'Evaluation and testing forms for skills, knowledge, or performance',
      complexity: 'high',
      keywords: ['assessment', 'test', 'evaluation', 'quiz', 'exam', 'skill'],
      template: `You are an expert in creating assessment forms. Generate a comprehensive assessment form JSON that follows these guidelines:

**Core Requirements:**
- Use appropriate question types for assessment
- Include scoring and evaluation logic
- Provide clear instructions and time limits
- Include progress tracking
- Support different assessment types
- Provide immediate or delayed feedback

**Assessment Types:**
- Knowledge tests (multiple choice, true/false)
- Skill assessments (practical tasks, scenarios)
- Personality assessments (rating scales, preferences)
- Performance evaluations (competency ratings)
- Certification exams (comprehensive testing)

**Question Types:**
- Multiple choice (single and multiple answers)
- True/False questions
- Rating scales (competency levels)
- Scenario-based questions
- Open-ended responses
- File uploads (for practical assessments)

**Scoring System:**
- Point values for each question
- Weighted scoring for different sections
- Pass/fail thresholds
- Grade calculations
- Competency level assessments
- Overall performance metrics

**User Experience:**
- Clear assessment instructions
- Time limit indicators
- Progress tracking
- Question navigation
- Save and resume capability
- Immediate feedback options

**Assessment Features:**
- Random question order
- Question pools
- Adaptive difficulty
- Time limits per question/section
- Review and change answers
- Final submission confirmation

**Results and Feedback:**
- Immediate score calculation
- Detailed performance breakdown
- Competency level indicators
- Improvement suggestions
- Certificate generation
- Results sharing options

Generate a comprehensive assessment form that provides accurate evaluation while maintaining a good user experience.`,
    });

    // Onboarding Forms
    this.templates.set('onboarding', {
      name: 'Onboarding Form',
      description: 'Welcome and setup forms for new users or employees',
      complexity: 'medium',
      keywords: [
        'onboarding',
        'welcome',
        'setup',
        'introduction',
        'getting started',
      ],
      template: `You are an expert in creating onboarding forms. Generate a welcoming onboarding form JSON that follows these guidelines:

**Core Requirements:**
- Introduce users to the platform/service
- Collect essential setup information
- Use friendly, encouraging language
- Include progress indicators
- Provide helpful tips and guidance
- Support different user types

**Onboarding Steps:**
- Welcome and introduction
- Account setup and preferences
- Profile completion
- Feature introduction
- Goal setting and preferences
- Completion and next steps

**Information Collection:**
- Basic profile information
- Preferences and settings
- Goals and objectives
- Experience level
- Communication preferences
- Notification settings

**User Experience:**
- Welcoming, encouraging tone
- Clear explanations of benefits
- Helpful tips and best practices
- Visual progress indicators
- Optional vs required fields
- Skip options for advanced users

**Guidance Features:**
- Tooltips and help text
- Example responses
- Best practice suggestions
- Feature highlights
- Getting started tips
- Support resources

**Personalization:**
- Customized content based on user type
- Relevant feature recommendations
- Personalized goal suggestions
- Tailored communication preferences
- Customizable dashboard options

**Completion:**
- Achievement celebration
- Next steps guidance
- Resource recommendations
- Support contact information
- Community access
- Training materials

Generate a comprehensive onboarding form that makes new users feel welcome while efficiently collecting necessary information.`,
    });
  }
}

/**
 * Utility functions for prompt template management
 */
export class PromptTemplateUtils {
  /**
   * Analyze a prompt and suggest the best template
   */
  static suggestTemplate(
    prompt: string,
    templates: PromptTemplate[]
  ): PromptTemplate | null {
    const lowerPrompt = prompt.toLowerCase();
    let bestMatch: PromptTemplate | null = null;
    let maxScore = 0;

    for (const template of templates) {
      let score = 0;

      // Check keyword matches
      for (const keyword of template.keywords) {
        if (lowerPrompt.includes(keyword)) {
          score += 1;
        }
      }

      // Check for complexity indicators
      if (
        template.complexity === 'high' &&
        (lowerPrompt.includes('complex') || lowerPrompt.includes('advanced'))
      ) {
        score += 2;
      } else if (
        template.complexity === 'low' &&
        (lowerPrompt.includes('simple') || lowerPrompt.includes('basic'))
      ) {
        score += 2;
      }

      if (score > maxScore) {
        maxScore = score;
        bestMatch = template;
      }
    }

    return bestMatch;
  }

  /**
   * Enhance a template with specific requirements
   */
  static enhanceTemplate(
    template: string,
    requirements: {
      complexity?: 'low' | 'medium' | 'high';
      features?: string[];
      targetAudience?: string;
      accessibilityLevel?: 'AA' | 'AAA';
    }
  ): string {
    let enhanced = template;

    if (requirements.complexity) {
      enhanced += `\n\n**Complexity Level:** ${requirements.complexity.toUpperCase()}`;
      if (requirements.complexity === 'high') {
        enhanced += '\n- Include advanced features and conditional logic';
        enhanced += '\n- Use multi-step navigation and complex validation';
      } else if (requirements.complexity === 'low') {
        enhanced += '\n- Keep the form simple and straightforward';
        enhanced += '\n- Use basic field types and minimal validation';
      }
    }

    if (requirements.features && requirements.features.length > 0) {
      enhanced += `\n\n**Required Features:** ${requirements.features.join(
        ', '
      )}`;
    }

    if (requirements.targetAudience) {
      enhanced += `\n\n**Target Audience:** ${requirements.targetAudience}`;
    }

    if (requirements.accessibilityLevel) {
      enhanced += `\n\n**Accessibility:** Ensure ${requirements.accessibilityLevel} compliance`;
    }

    return enhanced;
  }

  /**
   * Generate a custom prompt based on analysis
   */
  static generateCustomPrompt(analysis: {
    formType: string;
    complexity: string;
    features: string[];
    targetAudience?: string;
  }): string {
    let prompt = `Generate a ${analysis.formType} form with the following characteristics:\n\n`;

    prompt += `**Form Type:** ${analysis.formType}\n`;
    prompt += `**Complexity:** ${analysis.complexity}\n`;

    if (analysis.features.length > 0) {
      prompt += `**Features:** ${analysis.features.join(', ')}\n`;
    }

    if (analysis.targetAudience) {
      prompt += `**Target Audience:** ${analysis.targetAudience}\n`;
    }

    prompt += `\n**Requirements:**\n`;
    prompt += `- Follow best practices for ${analysis.formType} forms\n`;
    prompt += `- Use appropriate field types and validation\n`;
    prompt += `- Include clear instructions and helpful text\n`;
    prompt += `- Ensure accessibility compliance\n`;
    prompt += `- Provide good user experience\n`;

    return prompt;
  }
}
