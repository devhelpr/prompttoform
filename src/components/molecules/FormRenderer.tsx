import React, { useState } from 'react';

interface ComponentProps {
  type: string;
  id: string;
  label?: string;
  defaultValue?: unknown;
  options?: { label: string; value: string }[];
  required?: boolean;
  props?: Record<string, unknown>;
  children?: ComponentProps[];
  visibilityConditions?: VisibilityCondition[];
}

interface PageProps {
  id: string;
  title: string;
  route: string;
  layout?: string;
  components: ComponentProps[];
}

interface FormRendererProps {
  formJson: {
    app: {
      title: string;
      pages: PageProps[];
      dataSources?: Record<string, unknown>[];
    }
  };
}

interface FormValues {
  [key: string]: unknown;
}

type Option = {
  label?: string;
  value?: string;
} | string;

interface VisibilityCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: string | number | boolean;
}

const FormRenderer: React.FC<FormRendererProps> = ({ formJson }) => {
  const [formValues, setFormValues] = useState<FormValues>({});
  const [formSubmissions, setFormSubmissions] = useState<Record<string, FormValues>>({});

  if (!formJson || !formJson.app) {
    return <div className="p-4 text-red-500">Invalid form data</div>;
  }

  const handleInputChange = (id: string, value: unknown) => {
    setFormValues(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleFormSubmit = (formId: string) => {
    console.log(`Form ${formId} submitted:`, formValues);
    
    // Store the submission
    setFormSubmissions(prev => ({
      ...prev,
      [formId]: { ...formValues }
    }));

    // Show an alert
    alert(`Form "${formId}" submitted successfully!`);
  };

  const handleReset = () => {
    setFormValues({});
  };

  const handleButtonClick = (action: string) => {
    console.log('Button action:', action);
    // Handle button actions based on the action name
    switch(action) {
      case 'reset':
        handleReset();
        break;
      // Add other custom actions as needed
      default:
        console.log('Unknown button action:', action);
    }
  };

  const isComponentVisible = (visibilityConditions?: VisibilityCondition[]): boolean => {
    if (!visibilityConditions || visibilityConditions.length === 0) return true;
    
    return visibilityConditions.some((condition) => {
      const fieldValue = formValues[condition.field];
      const conditionValue = condition.value;
      
      switch (condition.operator) {
        case 'equals':
        case '==':
          return String(fieldValue) === String(conditionValue);
        case 'notEquals':
        case '!=':
          return String(fieldValue) !== String(conditionValue);
        case 'greaterThan':
        case '>':
          return Number(fieldValue) > Number(conditionValue);
        case 'lessThan':
        case '<':
          return Number(fieldValue) < Number(conditionValue);
        case '>=':
          return Number(fieldValue) >= Number(conditionValue);
        case '<=':
          return Number(fieldValue) <= Number(conditionValue);
        default:
          return true;
      }
    });
  };

  const renderComponent = (component: ComponentProps): React.ReactElement | null => {
    if (!component) return null;

    const { type, id, label, props = {}, visibilityConditions } = component;
    
    // Check visibility based on conditions
    if (!isComponentVisible(visibilityConditions)) {
      return null;
    }

    switch (type) {
      case 'text':
        return (
          <div className="mb-4">
            <p className="text-gray-700">{typeof label === 'string' ? label : (typeof props.content === 'string' ? props.content : 'Text')}</p>
          </div>
        );
      
      case 'input':
        return (
          <div className="mb-4">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
              {typeof label === 'string' ? label : ''}
              {!!props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              id={id}
              type={(props.inputType as React.HTMLInputTypeAttribute) || 'text'}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder={typeof props.placeholder === 'string' ? props.placeholder : ''}
              value={typeof formValues[id] === 'string' ? formValues[id] as string : ''}
              onChange={(e) => handleInputChange(id, e.target.value)}
              required={!!props.required}
            />
            {typeof props.helperText === 'string' && (
              <p className="mt-1 text-sm text-gray-500">{props.helperText}</p>
            )}
          </div>
        );
      
      case 'textarea':
        return (
          <div className="mb-4">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
              {typeof label === 'string' ? label : ''}
              {!!props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              id={id}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder={typeof props.placeholder === 'string' ? props.placeholder : ''}
              rows={Number(props.rows) || 3}
              value={typeof formValues[id] === 'string' ? formValues[id] as string : ''}
              onChange={(e) => handleInputChange(id, e.target.value)}
              required={!!props.required}
            />
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="mb-4 flex items-center">
            <input
              id={id}
              type="checkbox"
              className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              checked={!!formValues[id]}
              onChange={(e) => handleInputChange(id, e.target.checked)}
              required={!!props.required}
            />
            <label htmlFor={id} className="text-sm font-medium text-gray-700">
              {typeof label === 'string' ? label : ''}
              {!!props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        );
      
      case 'radio':
        return (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-1">
              {typeof label === 'string' ? label : ''}
              {!!props.required && <span className="text-red-500 ml-1">*</span>}
            </div>
            <div className="space-y-2">
              {Array.isArray(props.options) && props.options.map((option: Option, index: number) => {
                const optionLabel = typeof option === 'string' ? option : option.label || '';
                const optionValue = typeof option === 'string' ? option : option.value || '';
                
                return (
                  <div key={index} className="flex items-center">
                    <input
                      id={`${id}-${index}`}
                      type="radio"
                      name={id}
                      className="mr-2 h-4 w-4 text-indigo-600 border-gray-300"
                      value={optionValue}
                      checked={formValues[id] === optionValue}
                      onChange={() => handleInputChange(id, optionValue)}
                      required={!!props.required}
                    />
                    <label htmlFor={`${id}-${index}`} className="text-sm text-gray-700">
                      {optionLabel}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        );
      
      case 'select':
        return (
          <div className="mb-4">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
              {typeof label === 'string' ? label : ''}
              {!!props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              id={id}
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
              value={typeof formValues[id] === 'string' ? formValues[id] as string : ''}
              onChange={(e) => handleInputChange(id, e.target.value)}
              required={!!props.required}
            >
              <option value="">Select an option</option>
              {Array.isArray(props.options) && props.options.map((option: Option, index: number) => {
                const optionLabel = typeof option === 'string' ? option : option.label || '';
                const optionValue = typeof option === 'string' ? option : option.value || '';
                
                return (
                  <option key={index} value={optionValue}>
                    {optionLabel}
                  </option>
                );
              })}
            </select>
          </div>
        );
      
      case 'button':
        return (
          <button
            type={props.buttonType as "button" | "submit" | "reset" | undefined || 'button'}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            onClick={props.onClick ? () => handleButtonClick(props.onClick as string) : undefined}
          >
            {typeof props.label === 'string' ? props.label : 'Button'}
          </button>
        );
      
      case 'section':
        return (
          <div className="mb-6 p-4 border border-gray-200 rounded-md">
            {label && <h3 className="text-lg font-medium mb-4">{label}</h3>}
            {Array.isArray(component.children) && component.children.map((child, index) => (
              <div key={index}>{renderComponent(child)}</div>
            ))}
          </div>
        );
      
      case 'form':
        return (
          <div className="mb-6">
            {label && <h3 className="text-lg font-medium mb-4">{label}</h3>}
            <form onSubmit={(e) => {
              e.preventDefault();
              handleFormSubmit(id);
            }}>
              {Array.isArray(component.children) && component.children.map((child, index) => (
                <div key={index}>{renderComponent(child)}</div>
              ))}
              <div className="mt-4 flex space-x-3">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        );
      
      case 'table':
        return (
          <div className="mb-6 overflow-x-auto">
            {label && <h3 className="text-lg font-medium mb-4">{label}</h3>}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {Array.isArray(props.headers) && props.headers.length > 0 && (
                  <tr>
                    {props.headers.map((header, index) => (
                      <th
                        key={index}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(props.rows) && props.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Array.isArray(row) && row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'html':
        return (
          <div className="mb-4" dangerouslySetInnerHTML={{ __html: typeof props.content === 'string' ? props.content : '' }} />
        );
      
      default:
        return <div className="text-sm text-gray-500">Unsupported component type: {type}</div>;
    }
  };

  const renderPage = (page: PageProps): React.ReactElement | null => {
    if (!page || !page.components) return null;

    // Determine the layout class based on page.layout
    let layoutClass = '';
    switch (page.layout) {
      case 'grid':
        layoutClass = 'grid-cols-1 md:grid-cols-2 gap-4';
        break;
      case 'flex':
        layoutClass = 'flex flex-wrap';
        break;
      case 'vertical':
        layoutClass = 'flex flex-col';
        break;
      case 'horizontal':
        layoutClass = 'flex flex-row flex-wrap';
        break;
      default:
        layoutClass = '';
    }

    return (
      <div key={page.id} className="bg-white rounded-md shadow-sm p-6">
        <h2 className="text-xl font-bold mb-6">{page.title}</h2>
        <div className={`${page.layout ? `grid ${layoutClass}` : ''}`}>
          {Array.isArray(page.components) && page.components.map((component, index) => (
            <div key={index}>{renderComponent(component)}</div>
          ))}
        </div>
      </div>
    );
  };

  const getCurrentStep = (): { currentStep: number; totalSteps: number } => {
    // Default to the first step if not already tracking step state
    const totalSteps = formJson.app.pages?.length || 0;
    const currentStep = 1; // In a real app, you'd likely store this in state
    
    return { currentStep, totalSteps };
  };
  
  const renderStepIndicator = (currentStep: number, totalSteps: number): React.ReactElement => {
    return (
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">
          Step {currentStep} of {totalSteps}
        </div>
        <div className="w-2/3 bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };
  
  const renderMultiStepControls = (currentStep: number, totalSteps: number): React.ReactElement => {
    return (
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          className={`px-4 py-2 border border-indigo-300 text-indigo-700 rounded-md ${
            currentStep === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50'
          }`}
          disabled={currentStep === 1}
        >
          Previous
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          {currentStep === totalSteps ? 'Submit' : 'Next'}
        </button>
      </div>
    );
  };

  const renderMultiStepForm = (): React.ReactElement => {
    if (!formJson.app.pages || formJson.app.pages.length === 0) {
      return <div className="p-4 text-red-500">No pages defined in form</div>;
    }

    const { currentStep, totalSteps } = getCurrentStep();
    const currentPageIndex = currentStep - 1;
    
    if (currentPageIndex < 0 || currentPageIndex >= formJson.app.pages.length) {
      return <div className="p-4 text-red-500">Invalid page index</div>;
    }

    const currentPage = formJson.app.pages[currentPageIndex];
    
    return (
      <div className="w-full">
        {renderStepIndicator(currentStep, totalSteps)}
        {renderPage(currentPage)}
        {renderMultiStepControls(currentStep, totalSteps)}
      </div>
    );
  };

  const renderSubmissionData = (): React.ReactElement => {
    if (Object.keys(formSubmissions).length === 0) {
      return <div className="text-gray-500 italic">No submissions yet</div>;
    }

    return (
      <div>
        {Object.entries(formSubmissions).map(([formId, data]) => (
          <div key={formId} className="mb-4 p-4 border rounded">
            <h3 className="font-bold mb-2">Form: {formId}</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    );
  };

  // Display form submissions if any exist
  const hasSubmissions = Object.keys(formSubmissions).length > 0;

  return (
    <div className="w-full">
      <div className="mb-4 bg-indigo-50 p-4 rounded-md">
        <h1 className="text-2xl font-bold text-indigo-700">{formJson.app.title}</h1>
        {Array.isArray(formJson.app.pages) && formJson.app.pages.length > 1 && (
          <div className="mt-2 text-sm text-indigo-500">
            This application has {formJson.app.pages.length} pages
          </div>
        )}
      </div>

      <div className="space-y-8">
        {renderMultiStepForm()}
      </div>

      {hasSubmissions && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Form Submissions</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            {renderSubmissionData()}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormRenderer; 