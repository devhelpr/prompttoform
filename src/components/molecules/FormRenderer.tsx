import React, { useState } from "react";

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

// Add interface for validation errors
interface ValidationErrors {
  [key: string]: string;
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

// Define action type interface
interface ActionType {
  type: string;
  params?: Record<string, unknown>;
  dataSource?: string;
  targetPage?: string;
  message?: string;
  branches?: Branch[];
}

// Interface for branch definition with nextPage
interface Branch {
  condition: VisibilityCondition;
  nextPage: string;
}

// Interface for branch definition with advice
interface AdviceBranch {
  conditions: VisibilityCondition[];
  advice: string;
}

// Union type for different branch types
type BranchTypes = Branch | AdviceBranch;

interface ArrayItem {
  id: string;
  components: ComponentProps[];
}

const FormRenderer: React.FC<FormRendererProps> = ({ formJson }) => {
  const [formValues, setFormValues] = useState<FormValues>({});
  const [formSubmissions, setFormSubmissions] = useState<
    Record<string, FormValues>
  >({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [arrayItems, setArrayItems] = useState<
    Record<string, Record<string, unknown>[]>
  >({});

  if (!formJson || !formJson.app) {
    return <div className="p-4 text-red-500">Invalid form data</div>;
  }

  const handleInputChange = (id: string, value: unknown) => {
    // Update form values
    setFormValues((prev) => ({
      ...prev,
      [id]: value,
    }));

    // Clear validation error for this field if there is one and the new value passes validation
    if (validationErrors[id]) {
      // Clone the current errors
      const newValidationErrors = { ...validationErrors };

      // Check if the field is now valid
      let isNowValid = true;

      // Find component by id
      const findAndValidateComponent = (
        components: ComponentProps[]
      ): boolean => {
        for (const component of components) {
          if (component.id === id) {
            const { type, props = {} } = component;

            // Check if required and empty
            if (props.required) {
              // Special case for checkboxes: if required, value must be true
              if (type === "checkbox") {
                isNowValid = !!value;
              }
              // For other field types, check if empty
              else if (value === undefined || value === null || value === "") {
                isNowValid = false;
              }
              if (!isNowValid) return true; // Found and validation failed
            }

            // Additional validation for non-empty values
            if (value !== undefined && value !== null && value !== "") {
              // String validation for input and textarea
              if (type === "input" || type === "textarea") {
                const stringValue = String(value);

                // Email validation (input only)
                if (type === "input" && props.inputType === "email") {
                  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  isNowValid = emailPattern.test(stringValue);
                  if (!isNowValid) return true;
                }

                // URL validation (input only)
                if (type === "input" && props.inputType === "url") {
                  try {
                    new URL(stringValue);
                  } catch {
                    isNowValid = false;
                    return true;
                  }
                }

                // Min length validation
                if (props.minLength && typeof props.minLength === "number") {
                  isNowValid = stringValue.length >= props.minLength;
                  if (!isNowValid) return true;
                }

                // Max length validation
                if (props.maxLength && typeof props.maxLength === "number") {
                  isNowValid = stringValue.length <= props.maxLength;
                  if (!isNowValid) return true;
                }

                // Pattern validation (primarily for input)
                if (props.pattern && typeof props.pattern === "string") {
                  try {
                    const regex = new RegExp(props.pattern);
                    isNowValid = regex.test(stringValue);
                    if (!isNowValid) return true;
                  } catch {
                    // Invalid regex, skip this validation
                  }
                }

                // Number validation (input only)
                if (type === "input" && props.inputType === "number") {
                  const numValue = Number(value);

                  isNowValid = !isNaN(numValue);
                  if (!isNowValid) return true;

                  // Min value validation
                  if (props.min !== undefined && props.min !== null) {
                    isNowValid = numValue >= Number(props.min);
                    if (!isNowValid) return true;
                  }

                  // Max value validation
                  if (props.max !== undefined && props.max !== null) {
                    isNowValid = numValue <= Number(props.max);
                    if (!isNowValid) return true;
                  }
                }
              }

              // For select fields, just having a value is valid
              else if (type === "select") {
                // If we got here, the value is not empty, so it's valid
                isNowValid = true;
              }

              // For radio fields, just having a value is valid
              else if (type === "radio") {
                // If we got here, the value is not empty, so it's valid
                isNowValid = true;
              }

              // For checkbox fields, check if required and selected
              else if (type === "checkbox") {
                // For checkboxes, the value should be true if required
                isNowValid = !props.required || !!value;
              }
            }

            return true; // Found and validated
          }

          // Recursively check children components
          if (
            Array.isArray(component.children) &&
            component.children.length > 0
          ) {
            const found = findAndValidateComponent(component.children);
            if (found) return true;
          }
        }

        return false; // Component not found
      };

      // Check all components on the current page
      const currentPage = formJson.app.pages[currentStepIndex];
      if (currentPage && currentPage.components) {
        findAndValidateComponent(currentPage.components);

        // If the field is now valid, remove the error
        if (isNowValid) {
          delete newValidationErrors[id];
          setValidationErrors(newValidationErrors);
        }
      }
    }
  };

  const handleFormSubmit = (formId: string) => {
    // Validate the current page before submission
    if (!validateCurrentPage()) {
      // If validation fails, stop here and don't submit
      return;
    }

    console.log(`Form ${formId} submitted:`, formValues);

    // Store the submission
    setFormSubmissions((prev) => ({
      ...prev,
      [formId]: { ...formValues },
    }));

    // Clear validation errors after successful submission
    setValidationErrors({});

    // Show an alert
    alert(`Form "${formId}" submitted successfully!`);
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
    visibilityConditions?: VisibilityCondition[]
  ): boolean => {
    if (!visibilityConditions || visibilityConditions.length === 0) return true;

    return visibilityConditions.some((condition) => {
      const fieldValue = formValues[condition.field];
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

  // Find the index of a page by its ID
  const findPageIndexById = (pageId: string): number => {
    if (!formJson.app.pages) return -1;
    return formJson.app.pages.findIndex((page) => page.id === pageId);
  };

  // Check current page for decision tree branching
  const checkForBranching = (): number | null => {
    try {
      const currentPage = formJson.app.pages[currentStepIndex];
      if (!currentPage || !currentPage.components) return null;

      // Look for components with event handlers that have navigate actions with branches
      for (const component of currentPage.components) {
        if (component.eventHandlers) {
          const handlers = component.eventHandlers;

          // Check all possible event handlers
          for (const handlerKey of [
            "onClick",
            "onSubmit",
            "onChange",
          ] as const) {
            const handler = handlers[handlerKey];
            if (handler && handler.type === "navigate") {
              // Initialize with default targetPage if specified
              let targetPageIndex: number | null = null;

              if (handler.targetPage) {
                targetPageIndex = findPageIndexById(handler.targetPage);
              }

              // If there are branches, try to find a matching condition
              if (Array.isArray(handler.branches)) {
                let branchMatched = false;

                // Evaluate each branch
                for (const branch of handler.branches) {
                  try {
                    if ("condition" in branch && "nextPage" in branch) {
                      if (isComponentVisible([branch.condition])) {
                        // We found a matching condition, return the target page index
                        const branchTargetIndex = findPageIndexById(
                          branch.nextPage
                        );
                        if (branchTargetIndex !== -1) {
                          return branchTargetIndex;
                        }
                        branchMatched = true;
                      }
                    }
                  } catch (branchError) {
                    console.error(
                      "Error evaluating branch:",
                      branch,
                      branchError
                    );
                  }
                }

                // No branches matched but we have a default targetPage
                if (
                  !branchMatched &&
                  targetPageIndex !== null &&
                  targetPageIndex !== -1
                ) {
                  return targetPageIndex;
                }
              } else if (targetPageIndex !== null && targetPageIndex !== -1) {
                // No branches, but we have a targetPage
                return targetPageIndex;
              }
            }
          }
        }

        // For backward compatibility, also check if this component has branches property
        if (component.props && Array.isArray(component.props.branches)) {
          const branches = component.props.branches as BranchTypes[];

          // Evaluate each branch
          for (const branch of branches) {
            try {
              // Handle traditional branch with single condition and nextPage
              if ("condition" in branch && "nextPage" in branch) {
                if (isComponentVisible([branch.condition])) {
                  // We found a matching condition, return the target page index
                  const targetPageIndex = findPageIndexById(branch.nextPage);
                  if (targetPageIndex !== -1) {
                    return targetPageIndex;
                  }
                }
              }
              // Handle new branch format with multiple conditions and advice
              else if ("conditions" in branch && "advice" in branch) {
                // Check if all conditions are met
                const allConditionsMet = branch.conditions.every(
                  (condition: VisibilityCondition) => {
                    if (!condition || typeof condition.field !== "string")
                      return false;
                    return isComponentVisible([condition]);
                  }
                );

                if (allConditionsMet && typeof branch.advice === "string") {
                  // If all conditions are met, set the advice in form values
                  handleInputChange("adviceText", branch.advice);
                  // Don't navigate to another page, just stay on the current page
                  return currentStepIndex;
                }
              }
            } catch (branchError) {
              console.error("Error evaluating branch:", branch, branchError);
            }
          }
        }
      }

      return null; // No branching found or no conditions matched
    } catch (error) {
      console.error("Error in checkForBranching:", error);
      return null;
    }
  };

  // Validate current page's fields
  const validateCurrentPage = (): boolean => {
    const currentPage = formJson.app.pages[currentStepIndex];
    if (!currentPage || !currentPage.components) return true;

    const newValidationErrors: ValidationErrors = {};
    let isValid = true;

    // Recursively check all components and their children
    const validateComponent = (component: ComponentProps) => {
      const { type, id, props = {} } = component;

      // Skip validation if component isn't visible based on conditions
      if (!isComponentVisible(component.visibilityConditions)) {
        return;
      }

      // Handle array validation
      if (type === "array") {
        const items = arrayItems[id] || [];
        const itemCount = items.length;

        // Validate minItems
        if (typeof props.minItems === "number" && itemCount < props.minItems) {
          newValidationErrors[id] = `Minimum ${props.minItems} items required`;
          isValid = false;
          return;
        }

        // Validate maxItems
        if (typeof props.maxItems === "number" && itemCount > props.maxItems) {
          newValidationErrors[id] = `Maximum ${props.maxItems} items allowed`;
          isValid = false;
          return;
        }

        // Validate each array item's components
        items.forEach((item, index) => {
          component.arrayItems?.[0]?.components.forEach((itemComponent) => {
            const value = item[itemComponent.id];
            const itemId = `${id}[${index}].${itemComponent.id}`;

            // Required field validation
            if (itemComponent.props?.required) {
              if (value === undefined || value === null || value === "") {
                newValidationErrors[itemId] = `This field is required`;
                isValid = false;
                return;
              }
            }

            // Additional validation for non-empty values
            if (value !== undefined && value !== null && value !== "") {
              const stringValue = String(value);

              // Email validation
              if (itemComponent.props?.inputType === "email") {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(stringValue)) {
                  newValidationErrors[
                    itemId
                  ] = `Please enter a valid email address`;
                  isValid = false;
                  return;
                }
              }

              // URL validation
              if (itemComponent.props?.inputType === "url") {
                try {
                  new URL(stringValue);
                } catch {
                  newValidationErrors[itemId] = `Please enter a valid URL`;
                  isValid = false;
                  return;
                }
              }

              // Min length validation
              if (typeof itemComponent.props?.minLength === "number") {
                if (stringValue.length < itemComponent.props.minLength) {
                  newValidationErrors[
                    itemId
                  ] = `Minimum length is ${itemComponent.props.minLength} characters`;
                  isValid = false;
                  return;
                }
              }

              // Max length validation
              if (typeof itemComponent.props?.maxLength === "number") {
                if (stringValue.length > itemComponent.props.maxLength) {
                  newValidationErrors[
                    itemId
                  ] = `Maximum length is ${itemComponent.props.maxLength} characters`;
                  isValid = false;
                  return;
                }
              }

              // Pattern validation
              if (typeof itemComponent.props?.pattern === "string") {
                try {
                  const regex = new RegExp(itemComponent.props.pattern);
                  if (!regex.test(stringValue)) {
                    newValidationErrors[itemId] =
                      typeof itemComponent.props.patternError === "string"
                        ? itemComponent.props.patternError
                        : `Invalid format`;
                    isValid = false;
                    return;
                  }
                } catch {
                  console.error(
                    `Invalid regex pattern for field ${itemId}:`,
                    itemComponent.props.pattern
                  );
                }
              }

              // Number validation
              if (itemComponent.props?.inputType === "number") {
                const numValue = Number(value);

                if (isNaN(numValue)) {
                  newValidationErrors[itemId] = `Please enter a valid number`;
                  isValid = false;
                  return;
                }

                // Min value validation
                if (typeof itemComponent.props?.min === "number") {
                  if (numValue < itemComponent.props.min) {
                    newValidationErrors[
                      itemId
                    ] = `Minimum value is ${itemComponent.props.min}`;
                    isValid = false;
                    return;
                  }
                }

                // Max value validation
                if (typeof itemComponent.props?.max === "number") {
                  if (numValue > itemComponent.props.max) {
                    newValidationErrors[
                      itemId
                    ] = `Maximum value is ${itemComponent.props.max}`;
                    isValid = false;
                    return;
                  }
                }
              }
            }
          });
        });
      }
      // Handle regular component validation
      else if (
        ["input", "textarea", "select", "radio", "checkbox"].includes(type)
      ) {
        const value = formValues[id];

        // Required field validation
        if (props.required) {
          // Special case for checkboxes: if required, value must be true
          if (type === "checkbox") {
            if (!value) {
              newValidationErrors[id] = `This field is required`;
              isValid = false;
              return;
            }
          }
          // For other field types, check if empty
          else if (value === undefined || value === null || value === "") {
            newValidationErrors[id] = `This field is required`;
            isValid = false;
            return;
          }
        }

        // If value is empty and not required, skip other validations
        if (value === undefined || value === null || value === "") {
          return;
        }

        // Input-specific validations
        if (type === "input" || type === "textarea") {
          const stringValue = String(value);

          // Email validation
          if (type === "input" && props.inputType === "email") {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(stringValue)) {
              newValidationErrors[id] = `Please enter a valid email address`;
              isValid = false;
              return;
            }
          }

          // URL validation
          if (type === "input" && props.inputType === "url") {
            try {
              new URL(stringValue);
            } catch {
              newValidationErrors[id] = `Please enter a valid URL`;
              isValid = false;
              return;
            }
          }

          // Min length validation
          if (typeof props.minLength === "number") {
            if (stringValue.length < props.minLength) {
              newValidationErrors[
                id
              ] = `Minimum length is ${props.minLength} characters`;
              isValid = false;
              return;
            }
          }

          // Max length validation
          if (typeof props.maxLength === "number") {
            if (stringValue.length > props.maxLength) {
              newValidationErrors[
                id
              ] = `Maximum length is ${props.maxLength} characters`;
              isValid = false;
              return;
            }
          }

          // Pattern validation
          if (typeof props.pattern === "string") {
            try {
              const regex = new RegExp(props.pattern);
              if (!regex.test(stringValue)) {
                newValidationErrors[id] =
                  typeof props.patternError === "string"
                    ? props.patternError
                    : `Invalid format`;
                isValid = false;
                return;
              }
            } catch {
              console.error(
                `Invalid regex pattern for field ${id}:`,
                props.pattern
              );
            }
          }

          // Number validation
          if (type === "input" && props.inputType === "number") {
            const numValue = Number(value);

            if (isNaN(numValue)) {
              newValidationErrors[id] = `Please enter a valid number`;
              isValid = false;
              return;
            }

            // Min value validation
            if (typeof props.min === "number") {
              if (numValue < props.min) {
                newValidationErrors[id] = `Minimum value is ${props.min}`;
                isValid = false;
                return;
              }
            }

            // Max value validation
            if (typeof props.max === "number") {
              if (numValue > props.max) {
                newValidationErrors[id] = `Maximum value is ${props.max}`;
                isValid = false;
                return;
              }
            }
          }
        }
      }

      // Recursively validate children components if any
      if (Array.isArray(component.children)) {
        component.children.forEach(validateComponent);
      }
    };

    // Validate all components on the current page
    currentPage.components.forEach(validateComponent);

    // Update validation errors state
    setValidationErrors(newValidationErrors);
    return isValid;
  };

  const handleNext = () => {
    const totalSteps = formJson.app.pages?.length || 0;
    const currentPage = formJson.app.pages[currentStepIndex];

    // Validate the current page before navigation
    if (!validateCurrentPage()) {
      // If validation fails, stop here and don't navigate
      return;
    }

    // Clear validation errors when successfully navigating
    setValidationErrors({});

    // Check if current page is marked as an end page
    if (currentPage && currentPage.isEndPage === true) {
      // Handle final submission on end pages
      const formId = "multistep-form";
      handleFormSubmit(formId);
      return;
    }

    // Check for branching logic first
    const branchTargetIndex = checkForBranching();

    if (branchTargetIndex !== null) {
      // If we found a branch condition that matches, navigate to that page
      setCurrentStepIndex(branchTargetIndex);
    } else if (currentStepIndex < totalSteps - 1) {
      // No branching or no conditions matched, just go to the next page
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Handle final submission
      const formId = "multistep-form";
      handleFormSubmit(formId);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      // Clear validation errors when navigating to previous page
      setValidationErrors({});
      setCurrentStepIndex(currentStepIndex - 1);
    }
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

  const renderComponent = (
    component: ComponentProps
  ): React.ReactElement | null => {
    if (!component) return null;

    const { type, id, label, props = {}, visibilityConditions } = component;

    // Check visibility based on conditions
    if (!isComponentVisible(visibilityConditions)) {
      return null;
    }

    // Check if component has a validation error
    const hasError = !!validationErrors[id];

    switch (type) {
      case "text":
        return (
          <div className="mb-4">
            {typeof label === "string" && label !== "" && (
              <h4 className="text-base font-medium text-gray-800 mb-1">
                {label}
              </h4>
            )}
            <p className="text-gray-700">
              {/* If this is the advice text component and we have advice in formValues, use that */}
              {id === "adviceText" && typeof formValues.adviceText === "string"
                ? formValues.adviceText
                : typeof props.text === "string"
                ? props.text
                : typeof props.content === "string"
                ? props.content
                : ""}
            </p>
          </div>
        );

      case "input":
        return (
          <div className="mb-4">
            <label
              htmlFor={id}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {typeof label === "string" ? label : ""}
              {!!props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              id={id}
              type={(props.inputType as React.HTMLInputTypeAttribute) || "text"}
              className={`w-full p-2 border ${
                hasError ? "border-red-500" : "border-gray-300"
              } rounded-md`}
              placeholder={
                typeof props.placeholder === "string" ? props.placeholder : ""
              }
              value={
                typeof formValues[id] === "string"
                  ? (formValues[id] as string)
                  : ""
              }
              onChange={(e) => handleInputChange(id, e.target.value)}
              required={!!props.required}
            />
            {hasError && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors[id]}
              </p>
            )}
            {typeof props.helperText === "string" && !hasError && (
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
              {!!props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              id={id}
              className={`w-full p-2 border ${
                hasError ? "border-red-500" : "border-gray-300"
              } rounded-md`}
              placeholder={
                typeof props.placeholder === "string" ? props.placeholder : ""
              }
              rows={Number(props.rows) || 3}
              value={
                typeof formValues[id] === "string"
                  ? (formValues[id] as string)
                  : ""
              }
              onChange={(e) => handleInputChange(id, e.target.value)}
              required={!!props.required}
            />
            {hasError && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors[id]}
              </p>
            )}
          </div>
        );

      case "checkbox":
        return (
          <div className="mb-4 flex items-start">
            <div className="flex items-center h-5">
              <input
                id={id}
                type="checkbox"
                className={`h-4 w-4 text-indigo-600 border-gray-300 rounded ${
                  hasError ? "ring-2 ring-red-500" : ""
                }`}
                checked={!!formValues[id]}
                onChange={(e) => handleInputChange(id, e.target.checked)}
                required={!!props.required}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor={id} className="font-medium text-gray-700">
                {typeof label === "string" ? label : ""}
                {!!props.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              {hasError && (
                <p className="text-red-500">{validationErrors[id]}</p>
              )}
            </div>
          </div>
        );

      case "radio":
        return (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-1">
              {typeof label === "string" ? label : ""}
              {!!props.required && <span className="text-red-500 ml-1">*</span>}
            </div>
            <div
              className={`space-y-2 ${
                hasError ? "border border-red-500 p-2 rounded-md" : ""
              }`}
            >
              {Array.isArray(props.options) &&
                props.options.map((option: Option, index: number) => {
                  const optionLabel =
                    typeof option === "string" ? option : option.label || "";
                  const optionValue =
                    typeof option === "string" ? option : option.value || "";

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
                      <label
                        htmlFor={`${id}-${index}`}
                        className="text-sm text-gray-700"
                      >
                        {optionLabel}
                      </label>
                    </div>
                  );
                })}
            </div>
            {hasError && (
              <p className="mt-1 text-sm text-red-500">
                {validationErrors[id]}
              </p>
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
              {!!props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              id={id}
              className={`w-full p-2 border ${
                hasError ? "border-red-500" : "border-gray-300"
              } rounded-md bg-white`}
              value={
                typeof formValues[id] === "string"
                  ? (formValues[id] as string)
                  : ""
              }
              onChange={(e) => handleInputChange(id, e.target.value)}
              required={!!props.required}
            >
              <option value="">Select an option</option>
              {Array.isArray(props.options) &&
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
              <p className="mt-1 text-sm text-red-500">
                {validationErrors[id]}
              </p>
            )}
          </div>
        );

      case "button":
        // Skip buttons with default "Button" label
        if (typeof props.label !== "string" || props.label === "Button") {
          return null;
        }

        return (
          <button
            type={
              (props.buttonType as "button" | "submit" | "reset" | undefined) ||
              "button"
            }
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            onClick={
              props.onClick
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
                {Array.isArray(props.rows) &&
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
              __html: typeof props.content === "string" ? props.content : "",
            }}
          />
        );

      // Don't render decision tree components visually, but add advice display if available
      case "decisionTree":
        // This case is kept for backward compatibility
        // Check if we have advice generated from this decision tree
        if (
          typeof formValues.adviceText === "string" &&
          formValues.adviceText.trim() !== ""
        ) {
          return (
            <div className="mb-6 p-4 border border-gray-100 rounded-md bg-indigo-50">
              <h3 className="text-lg font-medium mb-2 text-indigo-700">
                Your Health Advice
              </h3>
              <p className="text-gray-700">{formValues.adviceText}</p>
            </div>
          );
        }
        console.warn(
          "'decisionTree' component type is deprecated. Use actions with branches instead."
        );
        return null;

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

    const handleItemChange = (
      index: number,
      fieldId: string,
      value: unknown
    ) => {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        [fieldId]: value,
      };
      setArrayItems((prev) => ({
        ...prev,
        [component.id]: newItems,
      }));
      handleInputChange(component.id, newItems);
    };

    return (
      <div className="array-field">
        {items.map((item, index) => (
          <div key={index} className="array-item">
            {component.arrayItems?.map((arrayItem) => (
              <div key={arrayItem.id} className="array-item-content">
                {arrayItem.components.map((comp) => (
                  <div key={comp.id} className="array-item-component">
                    {renderComponent({
                      ...comp,
                      id: `${comp.id}-${index}`,
                      defaultValue: item[comp.id],
                      eventHandlers: {
                        ...comp.eventHandlers,
                        onChange: {
                          type: "custom",
                          params: { value: item[comp.id] },
                        },
                      },
                    })}
                    <input
                      type="hidden"
                      value={JSON.stringify(item[comp.id])}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          comp.id,
                          JSON.parse(e.target.value)
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            ))}
            <button
              type="button"
              className="remove-item-button"
              onClick={() => handleRemoveItem(index)}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="add-item-button"
          onClick={handleAddItem}
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
