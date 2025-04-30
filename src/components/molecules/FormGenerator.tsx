import { useState } from 'react';
import Ajv2020 from "ajv/dist/2020"
import { UISchema } from '../../types/ui-schema';
import { generateUIFromPrompt } from '../../services/llm';
import { Settings } from './Settings';
import { evaluateAndRerunIfNeeded } from '../../services/prompt-eval';
import { getCurrentAPIConfig } from '../../services/llm-api';
import FormRenderer from './FormRenderer';
import { getSystemPrompt } from '../../prompt-library/system-prompt';
import schemaJson from '../../../schema.json';

// Define the evaluation result type
interface EvaluationResult {
  matchesPrompt: boolean;
  matchesSystemPrompt: boolean;
  missingElements: string[];
  suggestedHints: string[];
  score: number;
  reasoning: string;
}

// Define view modes
type ViewMode = 'json' | 'form';

// Cast schema to unknown first, then to UISchema
const uiSchema = schemaJson as unknown as UISchema;

// Skip validation for now to avoid schema issues
const skipValidation = true;

// Define interface for visibility conditions
interface VisibilityCondition {
  field: string;
  operator: "==" | "!=" | ">" | "<" | ">=" | "<=" | "equals" | "notEquals" | "greaterThan" | "lessThan";
  value: string | number | boolean;
}

// Define interface for component properties
interface ComponentProps {
  type: "array" | "text" | "input" | "textarea" | "checkbox" | "radio" | "select" | "button" | "table" | "form" | "section" | "date";
  id: string;
  label?: string;
  props?: Record<string, unknown>;
  children?: ComponentProps[];
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    minItems?: number;
    maxItems?: number;
    minDate?: string;
    maxDate?: string;
  };
  visibilityConditions?: VisibilityCondition[];
  eventHandlers?: Record<string, unknown>;
  arrayItems?: Array<{
    id: string;
    components: ComponentProps[];
  }>;
}

// Define interface for JSON types
interface UIJson {
  app: {
    title: string;
    pages: Array<{
      id: string;
      title: string;
      route: string;
      layout?: string;
      components: ComponentProps[];
      isEndPage?: boolean;
    }>;
    dataSources?: Array<{
      type: string;
      [key: string]: unknown;
    }>;
  };
}

export function FormGenerator() {
  const [prompt, setPrompt] = useState('');
  const [generatedJson, setGeneratedJson] = useState('');
  const [parsedJson, setParsedJson] = useState<UIJson | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('json');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setError(null);
    setEvaluation(null);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };
    
  const loadExampleForm = () => {
    const exampleForm = {
      "app": {
        "title": "Customer Feedback Form",
        "pages": [
          {
            "id": "feedback-page",
            "title": "Share Your Experience",
            "route": "/feedback",
            "layout": "vertical",
            "components": [
              {
                "type": "text",
                "id": "intro-text",
                "props": {
                  "content": "We value your feedback. Please take a moment to complete this form and help us improve our services."
                }
              },
              {
                "type": "form",
                "id": "feedback-form",
                "label": "Feedback Form",
                "children": [
                  {
                    "type": "section",
                    "id": "personal-info",
                    "label": "Personal Information",
                    "children": [
                      {
                        "type": "input",
                        "id": "name",
                        "label": "Full Name",
                        "props": {
                          "placeholder": "John Doe",
                          "required": true
                        }
                      },
                      {
                        "type": "input",
                        "id": "email",
                        "label": "Email Address",
                        "props": {
                          "inputType": "email",
                          "placeholder": "john.doe@example.com",
                          "required": true,
                          "helperText": "We'll never share your email with anyone else."
                        }
                      }
                    ]
                  },
                  {
                    "type": "section",
                    "id": "feedback-details",
                    "label": "Your Feedback",
                    "children": [
                      {
                        "type": "select",
                        "id": "service-type",
                        "label": "Which service are you providing feedback for?",
                        "props": {
                          "required": true,
                          "options": [
                            { "label": "Customer Support", "value": "support" },
                            { "label": "Product Quality", "value": "product" },
                            { "label": "Website Experience", "value": "website" },
                            { "label": "Billing & Payments", "value": "billing" },
                            { "label": "Other", "value": "other" }
                          ]
                        }
                      },
                      {
                        "type": "radio",
                        "id": "satisfaction",
                        "label": "How satisfied are you with our service?",
                        "props": {
                          "required": true,
                          "options": [
                            { "label": "Very Satisfied", "value": "5" },
                            { "label": "Satisfied", "value": "4" },
                            { "label": "Neutral", "value": "3" },
                            { "label": "Dissatisfied", "value": "2" },
                            { "label": "Very Dissatisfied", "value": "1" }
                          ]
                        }
                      },
                      {
                        "type": "textarea",
                        "id": "comments",
                        "label": "Please share any additional comments",
                        "props": {
                          "placeholder": "Share your thoughts here...",
                          "rows": 4
                        }
                      },
                      {
                        "type": "checkbox",
                        "id": "contact-permission",
                        "label": "You may contact me about my feedback"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    };
    
    setGeneratedJson(JSON.stringify(exampleForm, null, 2));
    setParsedJson(exampleForm as UIJson);
    
    // If example form is loaded, switch to form view automatically
    setViewMode('form');
  };

  const loadMultiStepExample = () => {
    const multiStepForm = {
      "app": {
        "title": "Product Order Wizard",
        "pages": [
          {
            "id": "customer-info",
            "title": "Customer Information",
            "route": "/order/customer",
            "layout": "vertical",
            "components": [
              {
                "type": "text",
                "id": "step1-intro",
                "props": {
                  "content": "Please provide your contact information to get started with your order."
                }
              },
              {
                "type": "form",
                "id": "customer-form",
                "label": "Contact Information",
                "children": [
                  {
                    "type": "input",
                    "id": "fullName",
                    "label": "Full Name",
                    "props": {
                      "required": true,
                      "placeholder": "John Doe"
                    }
                  },
                  {
                    "type": "input",
                    "id": "email",
                    "label": "Email Address",
                    "props": {
                      "inputType": "email",
                      "required": true,
                      "placeholder": "john@example.com",
                      "helperText": "We'll send your order confirmation to this email"
                    }
                  },
                  {
                    "type": "input",
                    "id": "phone",
                    "label": "Phone Number",
                    "props": {
                      "inputType": "tel",
                      "placeholder": "(555) 555-5555"
                    }
                  },
                  {
                    "type": "select",
                    "id": "customerType",
                    "label": "Customer Type",
                    "props": {
                      "required": true,
                      "options": [
                        { "label": "Individual", "value": "individual" },
                        { "label": "Business", "value": "business" }
                      ]
                    }
                  },
                  {
                    "type": "input",
                    "id": "companyName",
                    "label": "Company Name",
                    "props": {
                      "placeholder": "Acme Inc."
                    },
                    "visibilityConditions": [
                      {
                        "field": "customerType",
                        "operator": "==",
                        "value": "business"
                      }
                    ]
                  },
                  {
                    "type": "input",
                    "id": "taxId",
                    "label": "Tax ID / VAT Number",
                    "props": {
                      "placeholder": "12345678"
                    },
                    "visibilityConditions": [
                      {
                        "field": "customerType",
                        "operator": "==",
                        "value": "business"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "id": "product-selection",
            "title": "Product Selection",
            "route": "/order/products",
            "layout": "vertical",
            "components": [
              {
                "type": "text",
                "id": "step2-intro",
                "props": {
                  "content": "Select the products you want to order."
                }
              },
              {
                "type": "form",
                "id": "product-form",
                "label": "Products",
                "children": [
                  {
                    "type": "select",
                    "id": "productCategory",
                    "label": "Product Category",
                    "props": {
                      "required": true,
                      "options": [
                        { "label": "Electronics", "value": "electronics" },
                        { "label": "Furniture", "value": "furniture" },
                        { "label": "Clothing", "value": "clothing" }
                      ]
                    }
                  },
                  {
                    "type": "select",
                    "id": "electronicsProduct",
                    "label": "Select Electronics",
                    "props": {
                      "required": true,
                      "options": [
                        { "label": "Smartphone", "value": "smartphone" },
                        { "label": "Laptop", "value": "laptop" },
                        { "label": "Tablet", "value": "tablet" },
                        { "label": "Smart Watch", "value": "smartwatch" }
                      ]
                    },
                    "visibilityConditions": [
                      {
                        "field": "productCategory",
                        "operator": "==",
                        "value": "electronics"
                      }
                    ]
                  },
                  {
                    "type": "select",
                    "id": "furnitureProduct",
                    "label": "Select Furniture",
                    "props": {
                      "required": true,
                      "options": [
                        { "label": "Sofa", "value": "sofa" },
                        { "label": "Dining Table", "value": "dining_table" },
                        { "label": "Bed Frame", "value": "bed_frame" },
                        { "label": "Office Desk", "value": "office_desk" }
                      ]
                    },
                    "visibilityConditions": [
                      {
                        "field": "productCategory",
                        "operator": "==",
                        "value": "furniture"
                      }
                    ]
                  },
                  {
                    "type": "select",
                    "id": "clothingProduct",
                    "label": "Select Clothing",
                    "props": {
                      "required": true,
                      "options": [
                        { "label": "T-Shirt", "value": "tshirt" },
                        { "label": "Jeans", "value": "jeans" },
                        { "label": "Jacket", "value": "jacket" },
                        { "label": "Dress", "value": "dress" }
                      ]
                    },
                    "visibilityConditions": [
                      {
                        "field": "productCategory",
                        "operator": "==",
                        "value": "clothing"
                      }
                    ]
                  },
                  {
                    "type": "input",
                    "id": "quantity",
                    "label": "Quantity",
                    "props": {
                      "inputType": "number",
                      "required": true,
                      "placeholder": "1"
                    }
                  }
                ]
              }
            ]
          },
          {
            "id": "delivery-info",
            "title": "Delivery Information",
            "route": "/order/delivery",
            "layout": "vertical",
            "components": [
              {
                "type": "text",
                "id": "step3-intro",
                "props": {
                  "content": "Please provide your delivery details."
                }
              },
              {
                "type": "form",
                "id": "delivery-form",
                "label": "Delivery Details",
                "children": [
                  {
                    "type": "radio",
                    "id": "deliveryMethod",
                    "label": "Delivery Method",
                    "props": {
                      "required": true,
                      "options": [
                        { "label": "Standard Shipping (3-5 days)", "value": "standard" },
                        { "label": "Express Shipping (1-2 days)", "value": "express" },
                        { "label": "Same Day Delivery", "value": "same_day" }
                      ]
                    }
                  },
                  {
                    "type": "input",
                    "id": "address",
                    "label": "Street Address",
                    "props": {
                      "required": true,
                      "placeholder": "123 Main St"
                    }
                  },
                  {
                    "type": "input",
                    "id": "city",
                    "label": "City",
                    "props": {
                      "required": true,
                      "placeholder": "New York"
                    }
                  },
                  {
                    "type": "input",
                    "id": "state",
                    "label": "State/Province",
                    "props": {
                      "required": true,
                      "placeholder": "NY"
                    }
                  },
                  {
                    "type": "input",
                    "id": "zipCode",
                    "label": "ZIP / Postal Code",
                    "props": {
                      "required": true,
                      "placeholder": "10001"
                    }
                  },
                  {
                    "type": "checkbox",
                    "id": "sameAsBilling",
                    "label": "Billing address same as delivery address"
                  }
                ]
              }
            ]
          },
          {
            "id": "payment-info",
            "title": "Payment Information",
            "route": "/order/payment",
            "layout": "vertical",
            "components": [
              {
                "type": "text",
                "id": "step4-intro",
                "props": {
                  "content": "Please provide your payment details to complete your order."
                }
              },
              {
                "type": "form",
                "id": "payment-form",
                "label": "Payment Details",
                "children": [
                  {
                    "type": "radio",
                    "id": "paymentMethod",
                    "label": "Payment Method",
                    "props": {
                      "required": true,
                      "options": [
                        { "label": "Credit Card", "value": "credit_card" },
                        { "label": "PayPal", "value": "paypal" },
                        { "label": "Bank Transfer", "value": "bank_transfer" }
                      ]
                    }
                  },
                  {
                    "type": "section",
                    "id": "credit-card-details",
                    "label": "Credit Card Details",
                    "visibilityConditions": [
                      {
                        "field": "paymentMethod",
                        "operator": "==",
                        "value": "credit_card"
                      }
                    ],
                    "children": [
                      {
                        "type": "input",
                        "id": "cardNumber",
                        "label": "Card Number",
                        "props": {
                          "required": true,
                          "placeholder": "XXXX XXXX XXXX XXXX"
                        }
                      },
                      {
                        "type": "input",
                        "id": "cardName",
                        "label": "Name on Card",
                        "props": {
                          "required": true,
                          "placeholder": "John Doe"
                        }
                      },
                      {
                        "type": "input",
                        "id": "cardExpiry",
                        "label": "Expiration Date",
                        "props": {
                          "required": true,
                          "placeholder": "MM/YY"
                        }
                      },
                      {
                        "type": "input",
                        "id": "cardCVV",
                        "label": "CVV",
                        "props": {
                          "required": true,
                          "placeholder": "123"
                        }
                      }
                    ]
                  },
                  {
                    "type": "section",
                    "id": "paypal-details",
                    "label": "PayPal Details",
                    "visibilityConditions": [
                      {
                        "field": "paymentMethod",
                        "operator": "==",
                        "value": "paypal"
                      }
                    ],
                    "children": [
                      {
                        "type": "input",
                        "id": "paypalEmail",
                        "label": "PayPal Email",
                        "props": {
                          "inputType": "email",
                          "required": true,
                          "placeholder": "your-email@example.com"
                        }
                      }
                    ]
                  },
                  {
                    "type": "section",
                    "id": "bank-details",
                    "label": "Bank Details",
                    "visibilityConditions": [
                      {
                        "field": "paymentMethod",
                        "operator": "==",
                        "value": "bank_transfer"
                      }
                    ],
                    "children": [
                      {
                        "type": "input",
                        "id": "accountName",
                        "label": "Account Holder Name",
                        "props": {
                          "required": true,
                          "placeholder": "John Doe"
                        }
                      },
                      {
                        "type": "input",
                        "id": "accountNumber",
                        "label": "Account Number",
                        "props": {
                          "required": true,
                          "placeholder": "XXXXXXXX"
                        }
                      },
                      {
                        "type": "input",
                        "id": "bankName",
                        "label": "Bank Name",
                        "props": {
                          "required": true,
                          "placeholder": "Bank of Example"
                        }
                      }
                    ]
                  },
                  {
                    "type": "checkbox",
                    "id": "termsAgreed",
                    "label": "I agree to the terms and conditions",
                    "props": {
                      "required": true
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    };
    
    setGeneratedJson(JSON.stringify(multiStepForm, null, 2));
    setParsedJson(multiStepForm as UIJson);
    
    // If example form is loaded, switch to form view automatically
    setViewMode('form');
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEvaluation(null);
    setParsedJson(null);

    try {
      // Check if API key is set
      const apiConfig = getCurrentAPIConfig();
      if (!apiConfig.apiKey) {
        setError(`No API key set for ${apiConfig.name}. Please configure it in the Settings.`);
        setIsLoading(false);
        return;
      }

      // Call the UI generation API
      const response = await generateUIFromPrompt(prompt, uiSchema);
      
      // Try to parse the response as JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch {
        setError('Failed to parse the generated JSON. Please try again.');
        setGeneratedJson(response);
        setIsLoading(false);
        return;
      }

      // Skip validation for now to avoid schema issues
      if (!skipValidation) {
        try {
          // Initialize Ajv only when validation is needed
          const ajv = new Ajv2020({
            allErrors: true,
            strict: false,
            validateSchema: false
          });
          
          // Compile schema
          const validate = ajv.compile(uiSchema);
          const valid = validate(parsedResponse);
          if (!valid && validate.errors) {
            console.warn("UI validation errors:", validate.errors);
            setError(`Validation failed: ${ajv.errorsText(validate.errors)}`);
          }
        } catch (validationErr) {
          console.error("Schema validation error:", validationErr);
          // Continue despite validation errors
        }
      }
      
      // Store parsed response
      setParsedJson(parsedResponse);

      // Store string version
      setGeneratedJson(JSON.stringify(parsedResponse, null, 2));      
    } catch (err) {
      setError(`An error occurred while generating the UI/Form.`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluateAndRerun = async () => {
    if (!generatedJson) {
      setError('Generate content first before evaluating');
      return;
    }

    setIsEvaluating(true);
    setError(null);

    try {
      // Create a system message - same as used for generation
      const systemMessage = getSystemPrompt(uiSchema);

      const apiConfig = getCurrentAPIConfig();
      
      // Check if API key is set
      if (!apiConfig.apiKey) {
        setError(`No API key set for ${apiConfig.name}. Please configure it in the Settings.`);
        setIsEvaluating(false);
        return;
      }
      
      // Evaluate the output and rerun if needed
      const result = await evaluateAndRerunIfNeeded(
        prompt,
        systemMessage,
        generatedJson,
        apiConfig
      );
      
      setEvaluation(result.evaluation);
      
      // If the prompt was rerun and improved output was generated
      if (result.wasRerun && result.improvedOutput) {
        try {
          // Set the improved output
          setGeneratedJson(JSON.stringify(result.improvedOutput, null, 2));
          
        } catch (parseError) {
          console.error('Error parsing improved output:', parseError);
          // Keep original output if parsing fails
        }
      }
    } catch (err) {
      setError('An error occurred during evaluation.');
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (viewMode === 'json') {
      navigator.clipboard.writeText(generatedJson);
    }
  };

  const handleDownload = () => {
    let blob: Blob;
    let filename = '';
    
    if (viewMode === 'json' && generatedJson) {
      blob = new Blob([generatedJson], { type: 'application/json' });
      filename = 'ui-schema.json';
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleJsonChange = (newJson: string) => {
    setGeneratedJson(newJson);
    setJsonError(null);
    
    try {
      const parsed = JSON.parse(newJson) as UIJson;
      setParsedJson(parsed);
    } catch (error) {
      setJsonError('Invalid JSON format');
      console.error('JSON parsing error:', error);
    }
  };

  const validateAndUpdatePreview = () => {
    if (!skipValidation) {
      try {
        const ajv = new Ajv2020({
          allErrors: true,
          strict: false,
          validateSchema: false
        });
        
        const validate = ajv.compile(uiSchema);
        const valid = validate(parsedJson);
        
        if (!valid && validate.errors) {
          setError(`Validation failed: ${ajv.errorsText(validate.errors)}`);
          return;
        }
      } catch (validationErr) {
        console.error("Schema validation error:", validationErr);
        setError("Schema validation error occurred");
        return;
      }
    }
    
    setError(null);
    setViewMode('form');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-zinc-900">Generate Form/UI</h2>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="inline-flex items-center px-3 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Settings
        </button>
      </div>

      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-zinc-700 mb-2">
          Enter your prompt
        </label>
        <p className="text-sm text-zinc-500 mb-4">
          Describe a UI / Form / Layout / etc.
        </p>
        <textarea
          id="prompt"
          rows={5}
          className="w-full rounded-lg border border-zinc-200 shadow-sm focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 p-4 mt-2 text-base"
          placeholder=""
          value={prompt}
          onChange={handlePromptChange}
        />
        <div className="mt-4 flex justify-end space-x-2">
          <button
            type="button"
            onClick={loadExampleForm}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Load Example Form
          </button>
          <button
            type="button"
            onClick={loadMultiStepExample}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Load Multi-Step Form
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate UI/Form'}
          </button>
          
          {generatedJson && (
            <button
              type="button"
              onClick={handleEvaluateAndRerun}
              disabled={isEvaluating}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isEvaluating ? 'Evaluating...' : 'Evaluate & Improve'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {evaluation && (
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <div className="ml-3 w-full">
              <h3 className="text-sm font-medium text-blue-800">Evaluation Results</h3>
              <div className="mt-2 text-sm text-blue-700 space-y-2">
                <div className="flex justify-between">
                  <span>Matches Prompt:</span>
                  <span>{evaluation.matchesPrompt ? '✓' : '✗'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Matches System Prompt:</span>
                  <span>{evaluation.matchesSystemPrompt ? '✓' : '✗'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Score:</span>
                  <span>{evaluation.score}/10</span>
                </div>
                {evaluation.missingElements.length > 0 && (
                  <div>
                    <span className="font-medium">Missing Elements:</span>
                    <ul className="list-disc pl-4 mt-1">
                      {evaluation.missingElements.map((element: string, index: number) => (
                        <li key={index}>{element}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {evaluation.reasoning && (
                  <div>
                    <span className="font-medium">Reasoning:</span>
                    <p className="mt-1">{evaluation.reasoning}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {(generatedJson) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium text-zinc-900">
                Generated UI/Form
              </h3>
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => handleViewModeChange('json')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                    viewMode === 'json' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border border-gray-300 focus:z-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10`}
                >
                  JSON
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange('form')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                    viewMode === 'form' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border border-gray-300 focus:z-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10`}
                >
                  Preview
                </button>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyToClipboard}
                className="inline-flex items-center px-3 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Download
              </button>
            </div>
          </div>

          {viewMode === 'json' ? (
            <div className="space-y-4">
              <textarea
                value={generatedJson}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="w-full h-96 p-4 font-mono text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                spellCheck={false}
              />
              {jsonError && (
                <div className="text-red-500 text-sm">{jsonError}</div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={validateAndUpdatePreview}
                  disabled={!!jsonError}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Preview
                </button>
              </div>
            </div>
          ) : (
            viewMode === 'form' && parsedJson && parsedJson.app && (
              <div className="bg-white p-4 rounded-lg overflow-auto max-h-[800px] border border-zinc-300">
                <FormRenderer formJson={parsedJson} />
              </div>
            )
          )}
        </div>
      )}

      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
} 


