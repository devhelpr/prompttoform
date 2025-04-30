import React, { useState, useEffect, useMemo, useCallback } from "react";
import { HTMLInputTypeAttribute } from "react";

interface ComponentProps {
  type: "array" | "text" | "input" | "textarea" | "checkbox" | "radio" | "select" | "button" | "table" | "form" | "section" | "date" | "html" | "decisionTree";
  id: string;
  label?: string;
  defaultValue?: unknown;
  options?: { label: string; value: string }[];
  required?: boolean;
  props?: Record<string, unknown> & {
    inputType?: string;
    minDate?: string;
    maxDate?: string;
    min?: number;
    max?: number;
    placeholder?: string;
    helperText?: string;
    rows?: number;
    buttonType?: string;
    onClick?: string;
  };
  children?: ComponentProps[];
  visibilityConditions?: VisibilityCondition[];
  eventHandlers?: {
    onClick?: ActionType;
    onSubmit?: ActionType;
    onChange?: ActionType;
  };
  arrayItems?: ArrayItem[];
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    minItems?: number;
    maxItems?: number;
    minDate?: string;
    maxDate?: string;
    min?: number;
    max?: number;
  };
}

interface PageProps {
  id: string;
  title: string;
  route: string;
  layout?: string;
  components: ComponentProps[];
  isEndPage?: boolean;
}

interface FormRendererProps {
  formJson: {
    app: {
      title: string;
      pages: PageProps[];
      dataSources?: Record<string, unknown>[];
    };
  };
}

interface FormValues {
  [key: string]: unknown;
}

interface ValidationErrors {
  [key: string]: string[];
}

type Option =
  | {
      label?: string;
      value?: string;
    }
  | string;

interface VisibilityCondition {
  field: string;
  operator:
    | "equals"
    | "notEquals"
    | "greaterThan"
    | "lessThan"
    | "=="
    | "!="
    | ">"
    | "<"
    | ">="
    | "<=";
  value: string | number | boolean;
}

interface ActionType {
  type: string;
  params?: Record<string, unknown>;
  dataSource?: string;
  targetPage?: string;
  message?: string;
}

interface ArrayItem {
  id: string;
  components: ComponentProps[];
}

const FormRenderer: React.FC<FormRendererProps> = ({ formJson }) => {
  const [formValues, setFormValues] = useState<FormValues>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formSubmissions, setFormSubmissions] = useState<Record<string, FormValues>>({});
  const [arrayItems, setArrayItems] = useState<Record<string, Record<string, unknown>[]>>({});

  const validateComponent = useMemo(() => (
    component: ComponentProps,
    formData: Record<string, unknown>
  ): string[] => {
    const errors: string[] = [];
    const value = formData[component.id];

    if (component.validation?.required && !value) {
      errors.push("This field is required");
    }

    if (value) {
      if (component.type === "date") {
        const dateValue = new Date(value as string);
        if (isNaN(dateValue.getTime())) {
          errors.push("Invalid date format");
        }
      } else if (["input", "textarea"].includes(component.type)) {
        const stringValue = String(value);
        if (component.validation?.minLength && stringValue.length < component.validation.minLength) {
          errors.push(`Minimum length is ${component.validation.minLength} characters`);
        }
        if (component.validation?.maxLength && stringValue.length > component.validation.maxLength) {
          errors.push(`Maximum length is ${component.validation.maxLength} characters`);
        }
        if (component.validation?.pattern && !new RegExp(component.validation.pattern).test(stringValue)) {
          errors.push("Invalid format");
        }
      }
    }

    return errors;
  }, []);

  const validateForm = useCallback(() => {
    if (!formJson || !formJson.app) return true;
    
    const currentPage = formJson.app.pages[currentStepIndex];
    if (!currentPage || !currentPage.components) return true;

    const newValidationErrors: ValidationErrors = {};
    let isValid = true;

    const validateComponents = (components: ComponentProps[]) => {
      components.forEach((component) => {
        if (isComponentVisible(component.visibilityConditions, formValues)) {
          const errors = validateComponent(component, formValues);
          if (errors.length > 0) {
            newValidationErrors[component.id] = errors;
            isValid = false;
          }
        }
      });
    };

    validateComponents(currentPage.components);
    setValidationErrors(newValidationErrors);
    return isValid;
  }, [formJson, currentStepIndex, formValues, validateComponent]);

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  const handleInputChange = (id: string, value: unknown) => {
    setFormValues((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleFormSubmit = (formId: string) => {
    if (!validateForm()) {
      return;
    }

    setFormSubmissions((prev) => ({
      ...prev,
      [formId]: formValues,
    }));

    // Reset form values and validation errors
    setFormValues({});
    setValidationErrors({});
    setCurrentStepIndex(0);
  };

  const handleNext = () => {
    if (validateForm()) {
      const totalSteps = formJson.app.pages?.length || 0;
      const currentPage = formJson.app.pages[currentStepIndex];

      if (currentPage && currentPage.isEndPage === true) {
        handleFormSubmit("multistep-form");
        return;
      }

      if (currentStepIndex < totalSteps - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      } else {
        handleFormSubmit("multistep-form");
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setFormValues({});
  };

  const handleButtonClick = (action: string) => {
    console.log("Button action:", action);
    // Handle button actions based on the action name
    switch (action) {
      case "reset":
        handleReset();
        break;
      // Add other custom actions as needed
      default:
        console.log("Unknown button action:", action);
    }
  };

  const isComponentVisible = (
    visibilityConditions: VisibilityCondition[] | undefined,
    formData: Record<string, unknown>
  ): boolean => {
    if (!visibilityConditions || visibilityConditions.length === 0) return true;

    return visibilityConditions.every((condition) => {
      const fieldValue = formData[condition.field];
      const conditionValue = condition.value;

      switch (condition.operator) {
        case "equals":
        case "==":
          return String(fieldValue) === String(conditionValue);
        case "notEquals":
        case "!=":
          return String(fieldValue) !== String(conditionValue);
        case "greaterThan":
        case ">":
          return Number(fieldValue) > Number(conditionValue);
        case "lessThan":
        case "<":
          return Number(fieldValue) < Number(conditionValue);
        case ">=":
          return Number(fieldValue) >= Number(conditionValue);
        case "<=":
          return Number(fieldValue) <= Number(conditionValue);
        default:
          return true;
      }
    });
  };

  const getCurrentStep = (): { currentStep: number; totalSteps: number } => {
    // Use the state value instead of hardcoding
    const totalSteps = formJson.app.pages?.length || 0;
    const currentStep = currentStepIndex + 1; // Convert to 1-indexed for display

    return { currentStep, totalSteps };
  };

  const renderStepIndicator = (
    currentStep: number,
    totalSteps: number
  ): React.ReactElement => {
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

  const renderMultiStepControls = (
    currentStep: number,
    totalSteps: number
  ): React.ReactElement => {
    const currentPage = formJson.app.pages[currentStep - 1];
    const isEndPage = currentPage && currentPage.isEndPage === true;

    return (
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          className={`px-4 py-2 border border-indigo-300 text-indigo-700 rounded-md ${
            currentStep === 1
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-indigo-50"
          }`}
          disabled={currentStep === 1}
          onClick={handlePrevious}
        >
          Previous
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          onClick={handleNext}
        >
          {isEndPage || currentStep === totalSteps ? "Submit" : "Next"}
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

  const renderComponent = (component: ComponentProps): React.ReactElement => {
    const { id, type, label, props, validation } = component;
    const hasError = validationErrors[id]?.length > 0;

    switch (type) {
      case "input":
        return (
          <div className="mb-4">
            <label
              htmlFor={id}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {typeof label === "string" ? label : ""}
              {!!validation?.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              id={id}
              type={(props?.type as HTMLInputTypeAttribute) || "text"}
              className={`w-full p-2 border ${
                hasError ? "border-red-500" : "border-gray-300"
              } rounded-md`}
              value={typeof formValues[id] === "string" ? (formValues[id] as string) : ""}
              onChange={(e) => handleInputChange(id, e.target.value)}
              required={!!validation?.required}
              min={props?.type === "number" ? props.min : undefined}
              max={props?.type === "number" ? props.max : undefined}
            />
            {hasError && (
              <div className="mt-1 text-sm text-red-500">
                {validationErrors[id].map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}
            {typeof props?.helperText === "string" && !hasError && (
              <p className="mt-1 text-sm text-gray-500">{props.helperText}</p>
            )}
          </div>
        );

      case "textarea":
        return (
          <div className="mb-4">
            <label
              htmlFor={id}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {typeof label === "string" ? label : ""}
              {!!validation?.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              id={id}
              className={`w-full p-2 border ${
                hasError ? "border-red-500" : "border-gray-300"
              } rounded-md`}
              value={typeof formValues[id] === "string" ? (formValues[id] as string) : ""}
              onChange={(e) => handleInputChange(id, e.target.value)}
              required={!!validation?.required}
              rows={props?.rows || 3}
            />
            {hasError && (
              <div className="mt-1 text-sm text-red-500">
                {validationErrors[id].map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}
            {typeof props?.helperText === "string" && !hasError && (
              <p className="mt-1 text-sm text-gray-500">{props.helperText}</p>
            )}
          </div>
        );

      case "radio":
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {typeof label === "string" ? label : ""}
              {!!validation?.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {Array.isArray(props?.options) &&
                props.options.map((option: Option, index: number) => {
                  const optionLabel =
                    typeof option === "string" ? option : option.label || "";
                  const optionValue =
                    typeof option === "string" ? option : option.value || "";

                  return (
                    <div key={index} className="flex items-center">
                      <input
                        type="radio"
                        id={`${id}-${index}`}
                        name={id}
                        value={optionValue}
                        checked={formValues[id] === optionValue}
                        onChange={(e) => handleInputChange(id, e.target.value)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                        required={!!validation?.required}
                      />
                      <label
                        htmlFor={`${id}-${index}`}
                        className="ml-2 text-sm text-gray-700"
                      >
                        {optionLabel}
                      </label>
                    </div>
                  );
                })}
            </div>
            {hasError && (
              <div className="mt-1 text-sm text-red-500">
                {validationErrors[id].map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}
          </div>
        );

      case "checkbox":
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {typeof label === "string" ? label : ""}
              {!!validation?.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {Array.isArray(props?.options) &&
                props.options.map((option: Option, index: number) => {
                  const optionLabel =
                    typeof option === "string" ? option : option.label || "";
                  const optionValue =
                    typeof option === "string" ? option : option.value || "";

                  return (
                    <div key={index} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${id}-${index}`}
                        name={id}
                        value={optionValue}
                        checked={Array.isArray(formValues[id])
                          ? (formValues[id] as string[]).includes(optionValue)
                          : false}
                        onChange={(e) => {
                          const currentValues = Array.isArray(formValues[id])
                            ? (formValues[id] as string[])
                            : [];
                          const newValues = e.target.checked
                            ? [...currentValues, optionValue]
                            : currentValues.filter((v) => v !== optionValue);
                          handleInputChange(id, newValues);
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                        required={!!validation?.required}
                      />
                      <label
                        htmlFor={`${id}-${index}`}
                        className="ml-2 text-sm text-gray-700"
                      >
                        {optionLabel}
                      </label>
                    </div>
                  );
                })}
            </div>
            {hasError && (
              <div className="mt-1 text-sm text-red-500">
                {validationErrors[id].map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}
          </div>
        );

      case "select":
        return (
          <div className="mb-4">
            <label
              htmlFor={id}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {typeof label === "string" ? label : ""}
              {!!validation?.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              id={id}
              className={`w-full p-2 border ${
                hasError ? "border-red-500" : "border-gray-300"
              } rounded-md bg-white`}
              value={typeof formValues[id] === "string" ? (formValues[id] as string) : ""}
              onChange={(e) => handleInputChange(id, e.target.value)}
              required={!!validation?.required}
            >
              <option value="">Select an option</option>
              {Array.isArray(props?.options) &&
                props.options.map((option: Option, index: number) => {
                  const optionLabel =
                    typeof option === "string" ? option : option.label || "";
                  const optionValue =
                    typeof option === "string" ? option : option.value || "";

                  return (
                    <option key={index} value={optionValue}>
                      {optionLabel}
                    </option>
                  );
                })}
            </select>
            {hasError && (
              <div className="mt-1 text-sm text-red-500">
                {validationErrors[id].map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}
          </div>
        );

      case "date":
        return (
          <div className="mb-4">
            <label
              htmlFor={id}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {typeof label === "string" ? label : ""}
              {!!validation?.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              id={id}
              type="date"
              className={`w-full p-2 border ${
                hasError ? "border-red-500" : "border-gray-300"
              } rounded-md`}
              value={
                typeof formValues[id] === "string"
                  ? (formValues[id] as string)
                  : ""
              }
              min={props?.minDate}
              max={props?.maxDate}
              onChange={(e) => handleInputChange(id, e.target.value)}
              required={!!validation?.required}
            />
            {hasError && (
              <div className="mt-1 text-sm text-red-500">
                {validationErrors[id].map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}
            {typeof props?.helperText === "string" && !hasError && (
              <p className="mt-1 text-sm text-gray-500">{props.helperText}</p>
            )}
          </div>
        );

      case "button":
        if (typeof props?.label !== "string" || props.label === "Button") {
          return <></>;
        }

        return (
          <button
            type={
              (props?.buttonType as "button" | "submit" | "reset" | undefined) ||
              "button"
            }
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            onClick={
              props?.onClick
                ? () => handleButtonClick(props.onClick as string)
                : undefined
            }
          >
            {props.label}
          </button>
        );

      case "section":
        return (
          <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            {label && (
              <h3 className="text-lg font-medium mb-4 text-indigo-700">
                {label}
              </h3>
            )}
            <div className="space-y-3">
              {Array.isArray(component.children) &&
              component.children.length > 0 ? (
                component.children.map((child, index) => (
                  <div key={index}>{renderComponent(child)}</div>
                ))
              ) : (
                <div className="text-sm text-gray-500">
                  No content in this section
                </div>
              )}
            </div>
          </div>
        );

      case "form":
        return (
          <div className="mb-6">
            {label && <h3 className="text-lg font-medium mb-4">{label}</h3>}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Don't submit the form directly, the Next button will handle it
              }}
            >
              {Array.isArray(component.children) &&
                component.children.map((child, index) => (
                  <div key={index}>{renderComponent(child)}</div>
                ))}
              {/* Remove Submit and Reset buttons - Next button handles submission */}
            </form>
          </div>
        );

      case "table":
        return (
          <div className="mb-6 overflow-x-auto">
            {label && <h3 className="text-lg font-medium mb-4">{label}</h3>}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {Array.isArray(props?.headers) && props.headers.length > 0 && (
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
                {Array.isArray(props?.rows) &&
                  props.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Array.isArray(row) &&
                        row.map((cell, cellIndex) => (
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

      case "html":
        return (
          <div
            className="mb-4"
            dangerouslySetInnerHTML={{
              __html: typeof props?.content === "string" ? props.content : "",
            }}
          />
        );

      case "decisionTree":
        console.warn(
          "'decisionTree' component type is deprecated. Use actions with branches instead."
        );
        return <></>;

      case "array":
        return renderArrayField(component);

      default:
        return (
          <div className="text-sm text-gray-500">
            Unsupported component type: {type}
          </div>
        );
    }
  };

  const renderArrayField = (component: ComponentProps): React.ReactElement => {
    const items = arrayItems[component.id] || [];

    const handleAddItem = () => {
      const newItem: Record<string, unknown> = {};
      component.arrayItems?.forEach((arrayItem) => {
        arrayItem.components.forEach((comp) => {
          newItem[comp.id] = "";
        });
      });
      const newItems = [...items, newItem];
      setArrayItems((prev) => ({
        ...prev,
        [component.id]: newItems,
      }));
      handleInputChange(component.id, newItems);
    };

    const handleRemoveItem = (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      setArrayItems((prev) => ({
        ...prev,
        [component.id]: newItems,
      }));
      handleInputChange(component.id, newItems);
    };

    return (
      <div className="mb-4">
        <label
          htmlFor={component.id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {typeof component.label === "string" ? component.label : ""}
          {!!component.validation?.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
        {items.map((item, index) => (
          <div key={index} className="flex items-center mb-2">
            <div className="flex-1">
              {component.arrayItems?.map((arrayItem) => (
                <div key={arrayItem.id} className="mb-2">
                  {arrayItem.components.map((comp) => (
                    <div key={comp.id} className="mb-2">
                      {renderComponent({
                        ...comp,
                        id: `${component.id}[${index}].${comp.id}`,
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddItem}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Add Item
        </button>
      </div>
    );
  };

  const renderPage = (page: PageProps): React.ReactElement | null => {
    if (!page || !page.components) return null;

    // Determine the layout class based on page.layout
    let layoutClass = "";
    switch (page.layout) {
      case "grid":
        layoutClass = "grid-cols-1 md:grid-cols-2 gap-4";
        break;
      case "flex":
        layoutClass = "flex flex-wrap";
        break;
      case "vertical":
        layoutClass = "flex flex-col";
        break;
      case "horizontal":
        layoutClass = "flex flex-row flex-wrap";
        break;
      default:
        layoutClass = "";
    }

    return (
      <div key={page.id} className="bg-white rounded-md shadow-sm p-6">
        <h2 className="text-xl font-bold mb-6">{page.title}</h2>
        <div className={`${page.layout ? `grid ${layoutClass}` : ""}`}>
          {Array.isArray(page.components) &&
            page.components.map((component, index) => (
              <div key={index}>{renderComponent(component)}</div>
            ))}
        </div>
      </div>
    );
  };

  if (!formJson || !formJson.app) {
    return <div className="p-4 text-red-500">Invalid form data</div>;
  }

  return (
    <div className="w-full">
      <div className="mb-4 bg-indigo-50 p-4 rounded-md">
        <h1 className="text-2xl font-bold text-indigo-700">
          {formJson.app.title}
        </h1>
        {Array.isArray(formJson.app.pages) && formJson.app.pages.length > 1 && (
          <div className="mt-2 text-sm text-indigo-500">
            This application has {formJson.app.pages.length} pages
          </div>
        )}
      </div>

      <div className="space-y-8">{renderMultiStepForm()}</div>

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