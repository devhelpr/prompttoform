import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  TextFormField,
  FormInputField,
  FormTextareaField,
  FormRadioField,
  FormCheckboxField,
  FormSelectField,
  FormDateField,
  FormSectionField,
  FormConfirmationField,
  FormSliderRangeField,
  FormExpressionField,
} from '../atoms';
import { ExpressionContextProvider } from '../contexts/expression-context';
import {
  FormRendererProps,
  FormValues,
  ValidationErrors,
  PageProps,
  FormComponentFieldProps,
  ValidationError,
  VisibilityCondition,
  ThankYouPage,
  PageChangeEvent,
} from '../interfaces/form-interfaces';
import {
  MultiLanguageFormDefinition,
  FormRendererSettings as MultiLanguageFormRendererSettings,
} from '../interfaces/multi-language-interfaces';
import { TranslationService } from '../services/translation-service';
import {
  getClassNames,
  mergeClassNames,
  getText,
  getClassNamesWithColorAndStyle,
  convertToFieldClasses,
} from '../utils/class-utils';
import {
  defaultColorClasses,
  defaultStyleClasses,
} from '../config/default-classes';
import {
  calculateLogicalPageOrder,
  getLogicalPageIndex,
  getLogicalPageCount,
  isFirstLogicalPage,
  isLastLogicalPage,
} from '../utils/page-ordering';

/**
 * Helper function to merge color and style classes with legacy support
 */
const getMergedClasses = (
  componentKey: keyof typeof defaultColorClasses,
  settings: any
) => {
  // Use new color and style classes if available
  if (settings.colorClasses || settings.styleClasses) {
    const colorClass =
      settings.colorClasses?.[componentKey] ||
      defaultColorClasses[componentKey] ||
      '';
    const styleClass =
      settings.styleClasses?.[componentKey] ||
      defaultStyleClasses[componentKey] ||
      '';
    return getClassNamesWithColorAndStyle(colorClass, styleClass);
  }

  // Fallback to legacy classes
  return settings.classes?.[componentKey] || '';
};

/**
 * Helper function to get field classes with new structure support
 */
const getFieldClasses = (settings: any) => {
  return convertToFieldClasses(
    settings.colorClasses,
    settings.styleClasses,
    settings.classes
  );
};

export const FormRenderer: React.FC<FormRendererProps> = ({
  formJson,
  onSubmit,
  onPageChange,
  disabled = false,
  prefixId,
  settings = {},
}) => {
  const [formValues, setFormValues] = useState<FormValues>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [validation, setValidation] = useState<Record<string, boolean>>({});
  const [required, setRequired] = useState<Record<string, boolean>>({});
  const [blurredFields, setBlurredFields] = useState<Record<string, boolean>>(
    {}
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepHistory, setStepHistory] = useState<number[]>([0]);
  const [formSubmissions, setFormSubmissions] = useState<
    Record<string, FormValues>
  >({});
  const [showThankYouPage, setShowThankYouPage] = useState(false);
  const initialEventTriggeredRef = useRef(false);
  const logicalPageInitializedRef = useRef(false);

  // Calculate logical page order based on flow structure
  const logicalPageOrder = useMemo(() => {
    return calculateLogicalPageOrder(formJson);
  }, [formJson]);

  // Initialize current step index to the logical first page
  useEffect(() => {
    if (
      logicalPageOrder.length > 0 &&
      formJson?.app?.pages &&
      !logicalPageInitializedRef.current
    ) {
      const logicalFirstPageId = logicalPageOrder[0].pageId;
      const arrayIndex = formJson.app.pages.findIndex(
        (page) => page.id === logicalFirstPageId
      );
      if (arrayIndex !== -1) {
        setCurrentStepIndex(arrayIndex);
        setStepHistory([arrayIndex]);
      }
      logicalPageInitializedRef.current = true;
    }
  }, [logicalPageOrder, formJson?.app?.pages]);

  // Reset all form state when formJson changes
  useEffect(() => {
    if (!formJson) {
      return;
    }

    // Reset all form state to initial values
    setValidationErrors({});
    setValidation({});
    setRequired({});
    setBlurredFields({});
    setIsSubmitted(false);
    setCurrentStepIndex(0);
    setStepHistory([0]);
    setFormSubmissions({});
    setShowThankYouPage(false);
    initialEventTriggeredRef.current = false;
    logicalPageInitializedRef.current = false;

    const initialValues: FormValues = {};

    const initializeFieldValues = (components: FormComponentFieldProps[]) => {
      components.forEach((component) => {
        if (component.id) {
          // Initialize based on component type
          switch (component.type) {
            case 'slider-range':
              if (component.props?.mode === 'range') {
                initialValues[component.id] = {
                  min: component.props?.min ?? 0,
                  max: component.props?.max ?? 100,
                };
              } else {
                initialValues[component.id] = component.props?.min ?? 0;
              }
              break;
            case 'input':
            case 'textarea':
              initialValues[component.id] = '';
              break;
            case 'select':
            case 'radio':
              initialValues[component.id] = '';
              break;
            case 'checkbox':
              initialValues[component.id] = false;
              break;
            case 'date':
              initialValues[component.id] = '';
              break;
            default:
              initialValues[component.id] = null;
          }
        }

        // Recursively initialize children
        if (component.children) {
          initializeFieldValues(component.children);
        }
      });
    };

    // Initialize values for all pages - with null checks
    if (formJson?.app?.pages && Array.isArray(formJson.app.pages)) {
      formJson.app.pages.forEach((page) => {
        if (page.components) {
          initializeFieldValues(page.components);
        }
      });
    }

    setFormValues(initialValues);
  }, [formJson]);

  // Initialize translation service
  const translationService = useMemo(() => {
    const multiLangForm = formJson as MultiLanguageFormDefinition;
    const multiLangSettings = settings as MultiLanguageFormRendererSettings;

    return new TranslationService(
      multiLangForm.translations || {},
      multiLangSettings.currentLanguage ||
        multiLangForm.defaultLanguage ||
        'en',
      multiLangForm.defaultLanguage || 'en'
    );
  }, [formJson, settings]);

  // Initialize array fields in formValues
  useEffect(() => {
    if (!formJson?.app?.pages) return;

    const currentPage = formJson.app.pages[currentStepIndex];
    if (!currentPage?.components) return;

    setFormValues((prevFormValues) => {
      const newFormValues = { ...prevFormValues };
      let hasChanges = false;

      currentPage.components.forEach((component) => {
        if (component.type === 'array' && !(component.id in prevFormValues)) {
          newFormValues[component.id] = [];
          hasChanges = true;
        }
      });

      return hasChanges ? newFormValues : prevFormValues;
    });
  }, [formJson, currentStepIndex]);

  // Helper function to trigger page change event
  const triggerPageChangeEvent = useCallback(
    (newPageIndex: number, previousPageIndex?: number) => {
      if (!onPageChange || !formJson?.app?.pages) return;

      const newPage = formJson.app.pages[newPageIndex];
      const previousPage =
        previousPageIndex !== undefined
          ? formJson.app.pages[previousPageIndex]
          : undefined;

      // Get logical page information
      const logicalNewPageIndex = getLogicalPageIndex(
        newPage.id,
        logicalPageOrder
      );
      const logicalPreviousPageIndex =
        previousPageIndex !== undefined && previousPage
          ? getLogicalPageIndex(previousPage.id, logicalPageOrder)
          : undefined;
      const totalLogicalPages = getLogicalPageCount(logicalPageOrder);

      const event: PageChangeEvent = {
        pageId: newPage.id,
        pageIndex: logicalNewPageIndex, // Use logical index instead of array index
        pageTitle: newPage.title,
        totalPages: totalLogicalPages, // Use logical total instead of array length
        isFirstPage: isFirstLogicalPage(newPage.id, logicalPageOrder),
        isLastPage: isLastLogicalPage(newPage.id, logicalPageOrder),
        isEndPage: newPage.isEndPage === true,
        isConfirmationPage: newPage.isConfirmationPage === true,
        previousPageId: previousPage?.id,
        previousPageIndex: logicalPreviousPageIndex, // Use logical index
      };

      onPageChange(event);
    },
    [onPageChange, formJson, logicalPageOrder]
  );

  // Helper function to get field label for error messages
  const getFieldLabel = (component: FormComponentFieldProps): string => {
    if (typeof component.label === 'string' && component.label) {
      // Try to translate the label using the translation service
      const translatedLabel = translationService.translateComponent(
        component.id,
        0, // Assuming single page form for now
        'label',
        component.label
      );
      return translatedLabel;
    }
    // Fallback to ID if no label
    return component.id
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  // Helper function to get WCAG-compatible error message with fallbacks
  const getErrorMessage = useCallback(
    (
      component: FormComponentFieldProps,
      errorType: string,
      params: Record<string, string | number> = {}
    ): string => {
      const fieldLabel = getFieldLabel(component);

      // First try to get a translated error message
      const translatedError = translationService.translateError(
        errorType as keyof (typeof translationService)['defaultTexts']['errorMessages'],
        fieldLabel,
        params
      );

      // Check if we have a custom translation for this error type
      const hasCustomTranslation =
        translationService.translate(
          `errorMessages.${errorType}`,
          undefined,
          undefined,
          { fieldLabel, ...params }
        ) !== `errorMessages.${errorType}`;

      // If we have a custom translation, use it
      if (hasCustomTranslation) {
        return translatedError;
      }

      // If no custom translation, try component-specific error message
      const customMessage =
        component.validation?.errorMessages?.[
          errorType as keyof typeof component.validation.errorMessages
        ];

      if (customMessage) {
        // TODO: Remove this deprecation warning in a future version
        // Only show warning in development mode, not during tests
        if (import.meta.env.MODE === 'development' && !import.meta.env.VITEST) {
          console.warn(
            `Field-level errorMessages are deprecated. Please use translations instead. ` +
              `Field: ${component.id}, ErrorType: ${errorType}. ` +
              `Add this to your translations: errorMessages.${errorType}`
          );
        }
        return translationService.replacePlaceholders(customMessage, params);
      }

      // Fall back to default translated error message
      return translatedError;
    },
    [translationService]
  );

  const validateComponent = useMemo(
    () =>
      (
        component: FormComponentFieldProps,
        formData: Record<string, unknown>,
        parentId?: string
      ): ValidationError[] => {
        const errors: ValidationError[] = [];
        const fieldId = parentId ? `${parentId}.${component.id}` : component.id;
        const value = formData[fieldId];

        // Handle form component validation recursively
        if (component.type === 'form' && component.children) {
          // Validate all child components
          component.children.forEach((child) => {
            if (isComponentVisible(child.visibilityConditions, formData)) {
              const childErrors = validateComponent(child, formData, fieldId);
              errors.push(...childErrors);
            }
          });
          return errors;
        }

        // Handle array component validation
        if (component.type === 'array' && component.arrayItems) {
          const arrayValue = value as Array<Record<string, unknown>>;

          if (
            component.validation?.required &&
            (!arrayValue || arrayValue.length === 0)
          ) {
            errors.push({
              fieldId,
              message: getErrorMessage(component, 'required'),
            });
          }
          if (arrayValue) {
            if (
              component.validation?.minItems &&
              arrayValue.length < component.validation.minItems
            ) {
              errors.push({
                fieldId,
                message: getErrorMessage(component, 'minItems', {
                  minItems: component.validation.minItems,
                }),
              });
            }
            if (
              component.validation?.maxItems &&
              arrayValue.length > component.validation.maxItems
            ) {
              errors.push({
                fieldId,
                message: getErrorMessage(component, 'maxItems', {
                  maxItems: component.validation.maxItems,
                }),
              });
            }
            // Validate each array item
            arrayValue.forEach((item, index) => {
              component.arrayItems?.forEach((arrayItem) => {
                arrayItem.components.forEach((child) => {
                  const childFieldId = `${fieldId}[${index}].${child.id}`;
                  const shouldValidateChild = shouldShowError(childFieldId);

                  // Only validate child components that have been interacted with
                  if (shouldValidateChild) {
                    const childErrors = validateComponent(
                      child,
                      item,
                      `${fieldId}[${index}]`
                    );
                    errors.push(...childErrors);
                  }
                });
              });
            });
          }
          return errors;
        }

        // Handle section component validation
        if (component.type === 'section' && component.children) {
          component.children.forEach((child) => {
            if (isComponentVisible(child.visibilityConditions, formData)) {
              const childErrors = validateComponent(child, formData, fieldId);
              errors.push(...childErrors);
            }
          });
          return errors;
        }

        // Handle basic validation for other component types
        if (component.validation?.required && isEmptyValue(value)) {
          errors.push({
            fieldId,
            message: getErrorMessage(component, 'required'),
          });
        }

        if (!isEmptyValue(value)) {
          if (component.type === 'date') {
            const dateValue = new Date(value as string);
            if (isNaN(dateValue.getTime())) {
              errors.push({
                fieldId,
                message: getErrorMessage(component, 'invalidDate'),
              });
            } else {
              if (
                component.validation?.minDate &&
                dateValue < new Date(component.validation.minDate)
              ) {
                errors.push({
                  fieldId,
                  message: getErrorMessage(component, 'minDate', {
                    minDate: component.validation.minDate,
                  }),
                });
              }
              if (
                component.validation?.maxDate &&
                dateValue > new Date(component.validation.maxDate)
              ) {
                errors.push({
                  fieldId,
                  message: getErrorMessage(component, 'maxDate', {
                    maxDate: component.validation.maxDate,
                  }),
                });
              }
            }
          } else if (['input', 'textarea'].includes(component.type)) {
            const stringValue = String(value);

            // Email validation for email input type
            if (component.props?.inputType === 'email' && stringValue) {
              const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailPattern.test(stringValue)) {
                errors.push({
                  fieldId,
                  message: getErrorMessage(component, 'invalidEmail'),
                });
              }
            }

            // Number validation for number input type
            if (component.props?.inputType === 'number' && stringValue) {
              const numValue = Number(stringValue);
              if (isNaN(numValue)) {
                errors.push({
                  fieldId,
                  message: getErrorMessage(component, 'invalidNumber'),
                });
              } else {
                if (
                  component.validation?.min !== undefined &&
                  numValue < component.validation.min
                ) {
                  errors.push({
                    fieldId,
                    message: getErrorMessage(component, 'min', {
                      min: component.validation.min,
                    }),
                  });
                }
                if (
                  component.validation?.max !== undefined &&
                  numValue > component.validation.max
                ) {
                  errors.push({
                    fieldId,
                    message: getErrorMessage(component, 'max', {
                      max: component.validation.max,
                    }),
                  });
                }
              }
            }

            if (
              component.validation?.minLength &&
              stringValue.length < component.validation.minLength
            ) {
              errors.push({
                fieldId,
                message: getErrorMessage(component, 'minLength', {
                  minLength: component.validation.minLength,
                }),
              });
            }
            if (
              component.validation?.maxLength &&
              stringValue.length > component.validation.maxLength
            ) {
              errors.push({
                fieldId,
                message: getErrorMessage(component, 'maxLength', {
                  maxLength: component.validation.maxLength,
                }),
              });
            }
            if (
              component.validation?.pattern &&
              !new RegExp(component.validation.pattern).test(stringValue)
            ) {
              errors.push({
                fieldId,
                message: getErrorMessage(component, 'pattern'),
              });
            }
          } else if (component.type === 'slider-range') {
            const rangeValue = value as { min: number; max: number };

            if (
              rangeValue &&
              typeof rangeValue === 'object' &&
              'min' in rangeValue &&
              'max' in rangeValue
            ) {
              // Validate range span
              const rangeSpan = rangeValue.max - rangeValue.min;

              if (
                component.validation?.minRange &&
                rangeSpan < component.validation.minRange
              ) {
                errors.push({
                  fieldId,
                  message: getErrorMessage(component, 'minRange', {
                    minRange: component.validation.minRange,
                  }),
                });
              }

              if (
                component.validation?.maxRange &&
                rangeSpan > component.validation.maxRange
              ) {
                errors.push({
                  fieldId,
                  message: getErrorMessage(component, 'maxRange', {
                    maxRange: component.validation.maxRange,
                  }),
                });
              }

              // Validate minimum value constraints
              if (
                component.validation?.minValueMin !== undefined &&
                rangeValue.min < component.validation.minValueMin
              ) {
                errors.push({
                  fieldId,
                  message: getErrorMessage(component, 'minValueMin', {
                    minValueMin: component.validation.minValueMin,
                  }),
                });
              }

              if (
                component.validation?.minValueMax !== undefined &&
                rangeValue.min > component.validation.minValueMax
              ) {
                errors.push({
                  fieldId,
                  message: getErrorMessage(component, 'minValueMax', {
                    minValueMax: component.validation.minValueMax,
                  }),
                });
              }

              // Validate maximum value constraints
              if (
                component.validation?.maxValueMin !== undefined &&
                rangeValue.max < component.validation.maxValueMin
              ) {
                errors.push({
                  fieldId,
                  message: getErrorMessage(component, 'maxValueMin', {
                    maxValueMin: component.validation.maxValueMin,
                  }),
                });
              }

              if (
                component.validation?.maxValueMax !== undefined &&
                rangeValue.max > component.validation.maxValueMax
              ) {
                errors.push({
                  fieldId,
                  message: getErrorMessage(component, 'maxValueMax', {
                    maxValueMax: component.validation.maxValueMax,
                  }),
                });
              }
            }
          }
        }

        return errors;
      },
    [getErrorMessage]
  );

  const validateForm = useCallback(() => {
    if (
      !formJson ||
      !formJson.app ||
      !formJson.app.pages ||
      !Array.isArray(formJson.app.pages)
    )
      return true;

    const currentPage = formJson.app.pages[currentStepIndex];
    if (!currentPage || !currentPage.components) return true;

    const newValidationErrors: ValidationErrors = {};
    let isValid = true;

    const validateComponents = (
      components: FormComponentFieldProps[],
      parentId?: string
    ) => {
      components.forEach((component) => {
        if (isComponentVisible(component.visibilityConditions, formValues)) {
          const fieldId = parentId
            ? `${parentId}.${component.id}`
            : component.id;
          const errors = validateComponent(component, formValues, parentId);
          errors.forEach((error) => {
            if (!newValidationErrors[error.fieldId]) {
              newValidationErrors[error.fieldId] = [];
            }
            newValidationErrors[error.fieldId].push(error.message);
          });
          if (errors.length > 0) {
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
    // Only validate if we have form values initialized AND the user has interacted with the form
    if (
      Object.keys(formValues).length > 0 &&
      (isSubmitted || Object.keys(blurredFields).length > 0)
    ) {
      validateForm();
    }
  }, [validateForm, formValues, isSubmitted, blurredFields]);

  // Update translation service language when settings change
  useEffect(() => {
    const multiLangSettings = settings as MultiLanguageFormRendererSettings;
    if (multiLangSettings.currentLanguage) {
      translationService.setLanguage(multiLangSettings.currentLanguage);

      // Re-validate form with new language to update error messages
      if (isSubmitted || Object.keys(validationErrors).length > 0) {
        // Use setTimeout to avoid infinite loop and ensure validation runs after language change
        // Skip setTimeout in test environments to avoid timing issues
        if (import.meta.env.MODE === 'test' || import.meta.env.VITEST) {
          // Force a complete re-validation - validateForm will use the updated translation service
          const isValid = validateForm();
          // The validateForm function will call setValidationErrors with the new translated messages
        } else {
          setTimeout(() => {
            // Force a complete re-validation - validateForm will use the updated translation service
            const isValid = validateForm();
            // The validateForm function will call setValidationErrors with the new translated messages
          }, 0);
        }
      }
    }
  }, [translationService, settings, isSubmitted, validateForm]);

  // Reset initial event trigger when form changes
  useEffect(() => {
    initialEventTriggeredRef.current = false;
  }, [formJson?.app?.pages]);

  // Trigger initial page change event when component mounts
  useEffect(() => {
    if (
      onPageChange &&
      formJson?.app?.pages &&
      formJson.app.pages.length > 0 &&
      logicalPageOrder.length > 0 &&
      !initialEventTriggeredRef.current
    ) {
      // Use the logical first page instead of the first page in the array
      const logicalFirstPageId = logicalPageOrder[0].pageId;
      const initialPage = formJson.app.pages.find(
        (page) => page.id === logicalFirstPageId
      );
      if (!initialPage) return; // Safety check

      const logicalInitialPageIndex = 0; // First page in logical order
      const totalLogicalPages = getLogicalPageCount(logicalPageOrder);

      const event: PageChangeEvent = {
        pageId: initialPage.id,
        pageIndex: logicalInitialPageIndex, // Use logical index
        pageTitle: initialPage.title,
        totalPages: totalLogicalPages, // Use logical total
        isFirstPage: isFirstLogicalPage(initialPage.id, logicalPageOrder),
        isLastPage: isLastLogicalPage(initialPage.id, logicalPageOrder),
        isEndPage: initialPage.isEndPage === true,
        isConfirmationPage: initialPage.isConfirmationPage === true,
        previousPageId: undefined,
        previousPageIndex: undefined,
      };

      onPageChange(event);
      initialEventTriggeredRef.current = true;
    }
  }, [onPageChange, formJson?.app?.pages, logicalPageOrder]);

  const handleInputChange = (id: string, value: unknown) => {
    console.log(
      `🔄 FormRenderer: handleInputChange called for ${id} with value:`,
      value,
      typeof value
    );
    setFormValues((prev) => {
      const newValues = {
        ...prev,
        [id]: value,
      };
      console.log(`📝 FormRenderer: Updated formValues for ${id}:`, newValues);
      return newValues;
    });
  };

  const handleArrayItemChange = (
    arrayFieldId: string,
    itemIndex: number,
    fieldId: string,
    value: unknown
  ) => {
    setFormValues((prev) => {
      const newFormValues = { ...prev };
      const arrayValue =
        (newFormValues[arrayFieldId] as Array<Record<string, unknown>>) || [];

      // Ensure the array has enough items
      while (arrayValue.length <= itemIndex) {
        arrayValue.push({});
      }

      // Update the specific field in the array item
      arrayValue[itemIndex] = {
        ...arrayValue[itemIndex],
        [fieldId]: value,
      };

      newFormValues[arrayFieldId] = arrayValue;

      return newFormValues;
    });
  };

  const handleBlur = (id: string) => {
    setBlurredFields((prev) => ({
      ...prev,
      [id]: true,
    }));
  };

  const handleFormSubmit = (formId: string) => {
    setIsSubmitted(true);
    if (!validateForm()) {
      return;
    }

    setFormSubmissions((prev) => ({
      ...prev,
      [formId]: formValues,
    }));
    if (onSubmit) {
      onSubmit(formValues);
    }

    // Check if thank you page is configured
    if (formJson.app.thankYouPage) {
      setShowThankYouPage(true);
    } else {
      // Reset form values and validation errors
      setFormValues({});
      setValidationErrors({});
      setBlurredFields({});
      setIsSubmitted(false);
      setCurrentStepIndex(0);
      triggerPageChangeEvent(0);
      setStepHistory([0]);
    }
  };

  const getNextPage = useCallback((): string | null => {
    if (!formJson?.app?.pages || !Array.isArray(formJson.app.pages))
      return null;
    const currentPage = formJson.app.pages[currentStepIndex];
    if (!currentPage) return null;

    // Check for conditional branches first
    if (currentPage.branches) {
      for (const branch of currentPage.branches) {
        const fieldValue = formValues[branch.condition.field];
        const conditionValue = branch.condition.value;
        let conditionMet = false;

        switch (branch.condition.operator) {
          case '==':
            conditionMet = String(fieldValue) === String(conditionValue);
            break;
          case '!=':
            conditionMet = String(fieldValue) !== String(conditionValue);
            break;
          case '>':
            conditionMet = Number(fieldValue) > Number(conditionValue);
            break;
          case '<':
            conditionMet = Number(fieldValue) < Number(conditionValue);
            break;
          case '>=':
            conditionMet = Number(fieldValue) >= Number(conditionValue);
            break;
          case '<=':
            conditionMet = Number(fieldValue) <= Number(conditionValue);
            break;
        }

        if (conditionMet) {
          return branch.nextPage;
        }
      }
    }

    // If no branch conditions are met, use the nextPage field
    return currentPage.nextPage || null;
  }, [formJson, currentStepIndex, formValues]);

  const handleNext = useCallback(() => {
    setIsSubmitted(true);
    if (validateForm()) {
      const currentPage = formJson.app.pages[currentStepIndex];

      // Handle end pages or confirmation pages
      if (
        currentPage &&
        (currentPage.isEndPage === true ||
          currentPage.isConfirmationPage === true)
      ) {
        handleFormSubmit('multistep-form');
        return;
      }

      const nextPageId = getNextPage();
      if (nextPageId) {
        const nextPageIndex = formJson.app.pages.findIndex(
          (page) => page.id === nextPageId
        );
        if (nextPageIndex !== -1) {
          setStepHistory((prev) => [...prev, nextPageIndex]);
          setCurrentStepIndex(nextPageIndex);
          triggerPageChangeEvent(nextPageIndex, currentStepIndex);
          setIsSubmitted(false);
          return;
        }
      }

      // If no specific next page is defined, move to the next page in logical sequence
      const currentLogicalIndex =
        getLogicalIndexFromArrayIndex(currentStepIndex);
      const totalLogicalSteps = getLogicalPageCount(logicalPageOrder);

      if (
        currentLogicalIndex >= 0 &&
        currentLogicalIndex < totalLogicalSteps - 1
      ) {
        const nextLogicalIndex = currentLogicalIndex + 1;
        const nextArrayIndex = getArrayIndexFromLogicalIndex(nextLogicalIndex);

        if (nextArrayIndex !== -1) {
          setStepHistory((prev) => [...prev, nextArrayIndex]);
          setCurrentStepIndex(nextArrayIndex);
          triggerPageChangeEvent(nextArrayIndex, currentStepIndex);
          setIsSubmitted(false);
        } else {
          handleFormSubmit('multistep-form');
        }
      } else {
        handleFormSubmit('multistep-form');
      }
    }
  }, [
    formJson,
    currentStepIndex,
    validateForm,
    getNextPage,
    handleFormSubmit,
    formValues,
  ]);

  const handlePrevious = () => {
    if (stepHistory.length > 1) {
      const previousIndex = stepHistory[stepHistory.length - 2];
      setStepHistory((prev) => {
        const newHistory = [...prev];
        newHistory.pop(); // Remove current step
        return newHistory;
      });
      setCurrentStepIndex(previousIndex);
      triggerPageChangeEvent(previousIndex, currentStepIndex);
    } else {
      // If no history, try to go to previous logical page
      const currentLogicalIndex =
        getLogicalIndexFromArrayIndex(currentStepIndex);
      if (currentLogicalIndex > 0) {
        const previousLogicalIndex = currentLogicalIndex - 1;
        const previousArrayIndex =
          getArrayIndexFromLogicalIndex(previousLogicalIndex);

        if (previousArrayIndex !== -1) {
          setStepHistory([previousArrayIndex]);
          setCurrentStepIndex(previousArrayIndex);
          triggerPageChangeEvent(previousArrayIndex, currentStepIndex);
        }
      }
    }
  };

  const handleReset = () => {
    setFormValues({});
    setValidationErrors({});
    setBlurredFields({});
    setIsSubmitted(false);
    setCurrentStepIndex(0);
    triggerPageChangeEvent(0);
    setStepHistory([0]);
    setShowThankYouPage(false);
  };

  const handleThankYouAction = (
    action: 'restart' | 'custom',
    customAction?: string
  ) => {
    switch (action) {
      case 'restart':
        handleReset();
        break;
      case 'custom':
        if (customAction) {
          console.log('Custom action:', customAction);
          // Handle custom actions here
        }
        break;
    }
  };

  const handleButtonClick = (action: string) => {
    console.log('Button action:', action);
    // Handle button actions based on the action name
    switch (action) {
      case 'reset':
        handleReset();
        break;
      // Add other custom actions as needed
      default:
        console.log('Unknown button action:', action);
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

  const getCurrentStep = (): { currentStep: number; totalSteps: number } => {
    // Use logical page ordering instead of array-based indexing
    const currentPage = formJson?.app?.pages?.[currentStepIndex];
    if (!currentPage) {
      return { currentStep: 1, totalSteps: 1 };
    }

    const logicalPageIndex = getLogicalPageIndex(
      currentPage.id,
      logicalPageOrder
    );
    const totalLogicalSteps = getLogicalPageCount(logicalPageOrder);

    // Convert to 1-indexed for display
    const currentStep = logicalPageIndex + 1;

    return { currentStep, totalSteps: totalLogicalSteps };
  };

  // Helper function to get the array index from logical page order
  const getArrayIndexFromLogicalIndex = (logicalIndex: number): number => {
    if (logicalIndex < 0 || logicalIndex >= logicalPageOrder.length) {
      return -1;
    }
    const pageId = logicalPageOrder[logicalIndex].pageId;
    return formJson?.app?.pages?.findIndex((page) => page.id === pageId) ?? -1;
  };

  // Helper function to get the logical index from array index
  const getLogicalIndexFromArrayIndex = (arrayIndex: number): number => {
    if (arrayIndex < 0 || arrayIndex >= (formJson?.app?.pages?.length ?? 0)) {
      return -1;
    }
    const pageId = formJson?.app?.pages?.[arrayIndex]?.id;
    if (!pageId) return -1;
    return getLogicalPageIndex(pageId, logicalPageOrder);
  };

  const renderStepIndicator = (
    currentStep: number,
    totalSteps: number
  ): React.ReactElement | null => {
    // Don't render step indicator if there's only one page or no pages
    if (totalSteps <= 1) {
      return null;
    }

    return (
      <div
        className={
          getMergedClasses('stepIndicator', settings) ||
          'mb-4 flex items-center justify-between'
        }
      >
        <div
          className={
            getMergedClasses('stepIndicatorItem', settings) ||
            'text-sm font-medium text-gray-700'
          }
        >
          {translationService.translateUI('stepIndicator', {
            currentStep,
            totalSteps,
          })}
        </div>
        <div
          className={
            getMergedClasses('stepIndicator', settings) ||
            'w-2/3 bg-gray-200 rounded-full h-2.5'
          }
        >
          <div
            className={
              getMergedClasses('stepIndicatorActive', settings) ||
              'bg-indigo-600 h-2.5 rounded-full'
            }
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const renderMultiStepControls = (
    currentStep: number,
    totalSteps: number
  ): React.ReactElement | null => {
    if (disabled) {
      return null;
    }

    const currentPage = formJson?.app?.pages?.[currentStep - 1];
    const isEndPage = currentPage && currentPage.isEndPage === true;
    const isConfirmationPage =
      currentPage && currentPage.isConfirmationPage === true;

    // Determine button text based on page type
    let nextButtonText = translationService.translateUI('nextButton');
    if (isEndPage || currentStep === totalSteps) {
      nextButtonText = translationService.translateUI('submitButton');
    } else if (isConfirmationPage) {
      nextButtonText = translationService.translateUI('confirmSubmitButton');
    } else {
      // Check if next page is a confirmation page
      const nextPageIndex = currentStep;
      if (nextPageIndex < totalSteps) {
        const nextPage = formJson?.app?.pages?.[nextPageIndex];
        if (nextPage && nextPage.isConfirmationPage) {
          nextButtonText = translationService.translateUI(
            'reviewConfirmButton'
          );
        }
      }
    }

    return (
      <div
        className={
          getMergedClasses('navigationButtons', settings) ||
          'mt-6 flex justify-between'
        }
      >
        <button
          type="button"
          className={
            getMergedClasses('previousButton', settings) ||
            `px-4 py-2 border border-indigo-300 text-indigo-700 rounded-md ${
              currentStep === 1
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-indigo-50'
            }`
          }
          disabled={currentStep === 1}
          onClick={handlePrevious}
        >
          {translationService.translateUI('previousButton')}
        </button>
        <button
          type="button"
          className={
            getMergedClasses('nextButton', settings) ||
            'px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700'
          }
          onClick={handleNext}
        >
          {nextButtonText}
        </button>
      </div>
    );
  };

  const renderMultiStepForm = (): React.ReactElement => {
    if (
      !formJson?.app?.pages ||
      !Array.isArray(formJson.app.pages) ||
      formJson.app.pages.length === 0
    ) {
      return (
        <div
          className={
            getMergedClasses('noPagesDefined', settings) || 'p-4 text-red-500'
          }
        >
          {translationService.translateUI('noPagesDefined')}
        </div>
      );
    }

    const { currentStep, totalSteps } = getCurrentStep();

    // Use the actual array index, not the logical step number
    const currentPage = formJson.app.pages[currentStepIndex];

    if (!currentPage) {
      return (
        <div
          className={
            getMergedClasses('invalidPageIndex', settings) || 'p-4 text-red-500'
          }
        >
          {translationService.translateUI('invalidPageIndex')}
        </div>
      );
    }

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
      return (
        <div
          className={
            getMergedClasses('noSubmissionsText', settings) ||
            'text-gray-500 italic'
          }
        >
          {translationService.translateUI('noSubmissionsText')}
        </div>
      );
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

  const shouldShowError = (fieldId: string): boolean => {
    return isSubmitted || blurredFields[fieldId] === true;
  };

  const getPrefixedId = (id: string): string => {
    return prefixId ? `${prefixId}-${id}` : id;
  };

  // Helper function to get all form components from all pages (for confirmation display)
  const getAllFormComponents = (): FormComponentFieldProps[] => {
    if (!formJson?.app?.pages) return [];

    const allComponents: FormComponentFieldProps[] = [];
    const processedIds = new Set<string>();

    // Define field types that should be included in the summary
    const fieldTypes = [
      'input',
      'textarea',
      'select',
      'checkbox',
      'radio',
      'slider-range',
      'date',
      'time',
      'number',
    ];

    const extractComponents = (
      components: FormComponentFieldProps[],
      parentPath = ''
    ) => {
      components.forEach((component) => {
        const currentPath = parentPath
          ? `${parentPath}.${component.id}`
          : component.id;

        // Skip confirmation components to avoid self-reference
        if (component.type !== 'confirmation') {
          // Only add field components (not containers, buttons, etc.)
          if (fieldTypes.includes(component.type)) {
            // Only add if we haven't processed this component ID before
            if (!processedIds.has(component.id)) {
              // Create a copy of the component with the full path
              const componentWithPath = { ...component, fullPath: currentPath };
              allComponents.push(componentWithPath);
              processedIds.add(component.id);
            }
          }
        }
        if (component.children) {
          extractComponents(component.children, currentPath);
        }
        if (component.arrayItems) {
          component.arrayItems.forEach((arrayItem) => {
            if (arrayItem.components) {
              extractComponents(arrayItem.components, currentPath);
            }
          });
        }
      });
    };

    if (formJson?.app?.pages && Array.isArray(formJson.app.pages)) {
      formJson.app.pages.forEach((page) => {
        // Skip confirmation pages to avoid including confirmation components
        if (!page.isConfirmationPage && page.components) {
          extractComponents(page.components);
        }
      });
    }

    return allComponents;
  };

  // Helper function to check if a value is empty/should show as dash
  const isEmptyValue = (value: unknown): boolean => {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (typeof value === 'boolean') return false; // booleans are never "empty"
    if (typeof value === 'number') return false; // numbers are never "empty" (even 0)
    return false;
  };

  // Helper function to format values for display in template variables
  const formatValueForDisplay = (value: unknown): string => {
    if (Array.isArray(value)) {
      // Handle array values - format as a readable list
      if (value.length === 0) {
        return 'None';
      }

      // Check if it's an array of objects (like array field items)
      if (
        value.length > 0 &&
        typeof value[0] === 'object' &&
        value[0] !== null
      ) {
        // For array field items, extract the main field values
        return value
          .map((item, index) => {
            if (typeof item === 'object' && item !== null) {
              const itemValues = Object.values(item).filter(
                (v) => v !== undefined && v !== null && v !== ''
              );
              if (itemValues.length > 0) {
                return `Item ${index + 1}: ${itemValues.join(', ')}`;
              }
            }
            return `Item ${index + 1}`;
          })
          .join('; ');
      }

      // For simple arrays, join with commas
      return value.join(', ');
    }

    if (typeof value === 'object' && value !== null) {
      // Handle object values - extract meaningful values
      const objValues = Object.values(value).filter(
        (v) => v !== undefined && v !== null && v !== ''
      );
      if (objValues.length > 0) {
        return objValues.join(', ');
      }
      return 'Object';
    }

    // For primitive values, convert to string
    return String(value);
  };

  // Helper function to replace template variables in text
  const replaceTemplateVariables = (
    text: string,
    values: FormValues
  ): string => {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const varName = variable.trim();

      // Handle nested variable paths like "applicant.fullName"
      if (varName.includes('.')) {
        const keys = varName.split('.');
        let value: unknown = values;

        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = (value as Record<string, unknown>)[key];
          } else {
            value = undefined;
            break;
          }
        }

        if (!isEmptyValue(value)) {
          return formatValueForDisplay(value);
        }
      }

      // Try direct field name match
      let directValue = values[varName];
      if (!isEmptyValue(directValue)) {
        return formatValueForDisplay(directValue);
      }

      // Try common field name variations
      const variations = [
        varName.toLowerCase(),
        varName.replace(/([A-Z])/g, '_$1').toLowerCase(), // camelCase to snake_case
        varName.replace(/_/g, ''), // remove underscores
        varName.replace(/[._]/g, ''), // remove dots and underscores
      ];

      for (const variation of variations) {
        const value = values[variation];
        if (!isEmptyValue(value)) {
          return formatValueForDisplay(value);
        }
      }

      // Try to find partial matches in field names
      const matchingKey = Object.keys(values).find(
        (key) =>
          key.toLowerCase().includes(varName.toLowerCase()) ||
          varName.toLowerCase().includes(key.toLowerCase())
      );

      if (matchingKey && !isEmptyValue(values[matchingKey])) {
        return formatValueForDisplay(values[matchingKey]);
      }

      // Return a dash for missing/empty fields
      return '-';
    });
  };

  // Helper function to process props and replace template variables in helperText
  const processPropsWithTemplates = (props: any): any => {
    if (!props) return props;

    const processedProps = { ...props };

    if (
      typeof props.helperText === 'string' &&
      /\{\{[^}]+\}\}/.test(props.helperText)
    ) {
      processedProps.helperText = replaceTemplateVariables(
        props.helperText,
        formValues
      );
    }

    return processedProps;
  };

  const renderComponent = useCallback(
    (
      component: FormComponentFieldProps,
      parentId?: string
    ): React.ReactElement => {
      // Check visibility first
      if (!isComponentVisible(component.visibilityConditions, formValues)) {
        return <></>;
      }

      const {
        id,
        type,
        label,
        props,
        validation: componentValidation,
      } = component;
      const fieldId = parentId ? `${parentId}.${id}` : id;
      const prefixedFieldId = getPrefixedId(fieldId);
      const hasError = validationErrors[fieldId]?.length > 0;
      const showError = shouldShowError(fieldId) && hasError;

      // Get translated values using specialized methods
      const translatedLabel = translationService.translateComponent(
        id,
        currentStepIndex,
        'label',
        label
      );
      const translatedProps: any = {
        ...props,
        // Include expression if it exists on the component
        ...(component.expression && { expression: component.expression }),
      };

      // Only include placeholder if it exists in the original props
      if (props?.placeholder !== undefined) {
        translatedProps.placeholder = translationService.translateComponent(
          id,
          currentStepIndex,
          'props.placeholder',
          props?.placeholder
        );
      }

      // Only include helperText if it exists in the original props
      if (props?.helperText !== undefined) {
        translatedProps.helperText = translationService.translateComponent(
          id,
          currentStepIndex,
          'props.helperText',
          props?.helperText
        );
      }

      // Handle translated options for select/radio components
      if (
        (type === 'select' || type === 'radio') &&
        props?.options &&
        Array.isArray(props.options)
      ) {
        translatedProps.options = props.options.map(
          (option: any, index: number) => ({
            ...option,
            label: translationService.translateComponent(
              id,
              currentStepIndex,
              `props.options.${index}.label`,
              option.label
            ),
          })
        );
      }

      // Handle translated validation messages
      const translatedValidation = componentValidation
        ? {
            ...componentValidation,
            errorMessages: componentValidation.errorMessages
              ? Object.fromEntries(
                  Object.entries(componentValidation.errorMessages).map(
                    ([key, message]) => [
                      key,
                      translationService.translateComponent(
                        id,
                        currentStepIndex,
                        `validation.errorMessages.${key}`,
                        message as string
                      ),
                    ]
                  )
                )
              : undefined,
          }
        : undefined;

      switch (type) {
        case 'text':
          // Check if this text component has an expression
          if (translatedProps?.expression) {
            // Use FormExpressionField for text components with expressions
            return (
              <FormExpressionField
                fieldId={prefixedFieldId}
                label={translatedLabel}
                expression={translatedProps.expression.expression}
                mode={translatedProps.expression.mode || 'value'}
                dependencies={translatedProps.expression.dependencies}
                context={{
                  values: formValues,
                  validation: validation,
                  required: required,
                  errors: Object.keys(validationErrors).reduce((acc, key) => {
                    acc[key] = validationErrors[key]?.[0] || undefined;
                    return acc;
                  }, {} as Record<string, string | undefined>),
                }}
                classes={getFieldClasses(settings)}
              >
                <TextFormField
                  fieldId={prefixedFieldId}
                  label={translatedLabel}
                  props={processPropsWithTemplates(translatedProps)}
                  classes={getFieldClasses(settings)}
                  colorClasses={settings.colorClasses}
                  styleClasses={settings.styleClasses}
                />
              </FormExpressionField>
            );
          } else {
            // Use regular TextFormField for text components without expressions
            return (
              <TextFormField
                fieldId={prefixedFieldId}
                label={translatedLabel}
                props={translatedProps}
                formValues={formValues}
                classes={getFieldClasses(settings)}
                colorClasses={settings.colorClasses}
                styleClasses={settings.styleClasses}
              />
            );
          }

        case 'input':
          return (
            <FormInputField
              fieldId={prefixedFieldId}
              label={translatedLabel}
              value={
                typeof formValues[fieldId] === 'string'
                  ? (formValues[fieldId] as string)
                  : ''
              }
              onChange={(value) => handleInputChange(fieldId, value)}
              onBlur={() => handleBlur(fieldId)}
              validation={translatedValidation}
              expression={translatedProps?.expression}
              props={{
                ...processPropsWithTemplates(translatedProps),
              }}
              showError={showError}
              validationErrors={validationErrors[fieldId] || []}
              disabled={disabled}
              classes={getFieldClasses(settings)}
              colorClasses={settings.colorClasses}
              styleClasses={settings.styleClasses}
            />
          );

        case 'textarea':
          return (
            <FormTextareaField
              fieldId={prefixedFieldId}
              label={translatedLabel}
              value={
                typeof formValues[fieldId] === 'string'
                  ? (formValues[fieldId] as string)
                  : ''
              }
              onChange={(value) => handleInputChange(fieldId, value)}
              onBlur={() => handleBlur(fieldId)}
              validation={translatedValidation}
              expression={translatedProps?.expression}
              props={{
                ...processPropsWithTemplates(translatedProps),
              }}
              showError={showError}
              validationErrors={validationErrors[fieldId] || []}
              disabled={disabled}
              classes={getFieldClasses(settings)}
              colorClasses={settings.colorClasses}
              styleClasses={settings.styleClasses}
            />
          );

        case 'radio':
          return (
            <FormRadioField
              fieldId={prefixedFieldId}
              label={translatedLabel}
              value={
                typeof formValues[fieldId] === 'string'
                  ? (formValues[fieldId] as string)
                  : ''
              }
              onChange={(value) => handleInputChange(fieldId, value)}
              validation={translatedValidation}
              props={processPropsWithTemplates(translatedProps)}
              showError={showError}
              validationErrors={validationErrors[fieldId] || []}
              disabled={disabled}
              classes={getFieldClasses(settings)}
              colorClasses={settings.colorClasses}
              styleClasses={settings.styleClasses}
            />
          );

        case 'checkbox':
          return (
            <FormCheckboxField
              fieldId={prefixedFieldId}
              label={translatedLabel}
              value={formValues[fieldId] as boolean | string[]}
              onChange={(value) => handleInputChange(fieldId, value)}
              onBlur={() => handleBlur(fieldId)}
              validation={translatedValidation}
              props={processPropsWithTemplates(translatedProps)}
              showError={showError}
              validationErrors={validationErrors[fieldId] || []}
              disabled={disabled}
              classes={getFieldClasses(settings)}
              colorClasses={settings.colorClasses}
              styleClasses={settings.styleClasses}
            />
          );

        case 'select':
          return (
            <FormSelectField
              fieldId={prefixedFieldId}
              label={translatedLabel}
              value={
                typeof formValues[fieldId] === 'string'
                  ? (formValues[fieldId] as string)
                  : ''
              }
              onChange={(value) => handleInputChange(fieldId, value)}
              onBlur={() => handleBlur(fieldId)}
              validation={translatedValidation}
              props={processPropsWithTemplates(translatedProps)}
              showError={showError}
              validationErrors={validationErrors[fieldId] || []}
              disabled={disabled}
              classes={getFieldClasses(settings)}
              colorClasses={settings.colorClasses}
              styleClasses={settings.styleClasses}
            />
          );

        case 'date':
          return (
            <FormDateField
              fieldId={prefixedFieldId}
              label={translatedLabel}
              value={
                typeof formValues[fieldId] === 'string'
                  ? (formValues[fieldId] as string)
                  : ''
              }
              onChange={(value) => handleInputChange(fieldId, value)}
              onBlur={() => handleBlur(fieldId)}
              validation={translatedValidation}
              props={processPropsWithTemplates(translatedProps)}
              showError={showError}
              validationErrors={validationErrors[fieldId] || []}
              disabled={disabled}
              classes={getFieldClasses(settings)}
              colorClasses={settings.colorClasses}
              styleClasses={settings.styleClasses}
            />
          );

        case 'button':
          if (typeof props?.label !== 'string' || props.label === 'Button') {
            return <></>;
          }

          return (
            <button
              type={
                (props?.buttonType as
                  | 'button'
                  | 'submit'
                  | 'reset'
                  | undefined) || 'button'
              }
              className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 ${
                disabled ? 'cursor-not-allowed opacity-50' : ''
              }`}
              onClick={
                props?.onClick
                  ? () => handleButtonClick(props.onClick as string)
                  : undefined
              }
              disabled={disabled}
            >
              {props.label}
            </button>
          );

        case 'section':
          return (
            <FormSectionField
              fieldId={prefixedFieldId}
              label={label}
              children={component.children}
              renderComponent={renderComponent}
              className={translatedProps?.className}
              classes={getFieldClasses(settings)}
              colorClasses={settings.colorClasses}
              styleClasses={settings.styleClasses}
            />
          );

        case 'form':
          return (
            <div className={getMergedClasses('formLayout', settings) || 'mb-6'}>
              {label && <h3 className="text-lg font-medium mb-4">{label}</h3>}
              <form
                data-netlify="true"
                onSubmit={(e) => {
                  e.preventDefault();
                  // Don't submit the form directly, the Next button will handle it
                }}
              >
                {Array.isArray(component.children) &&
                  component.children.map((child, index) => (
                    <div key={index}>{renderComponent(child, fieldId)}</div>
                  ))}
                {/* Remove Submit and Reset buttons - Next button handles submission */}
              </form>
            </div>
          );

        case 'table':
          return (
            <div className="mb-6 overflow-x-auto">
              {label && <h3 className="text-lg font-medium mb-4">{label}</h3>}
              <table className="min-w-full divide-y divide-gray-200">
                <thead
                  className={
                    getMergedClasses('tableHeader', settings) || 'bg-gray-50'
                  }
                >
                  {Array.isArray(props?.headers) &&
                    props.headers.length > 0 && (
                      <tr>
                        {props.headers.map((header, index) => (
                          <th
                            key={index}
                            scope="col"
                            className={
                              getMergedClasses('tableCell', settings) ||
                              'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                            }
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
                              className={
                                getMergedClasses('tableCell', settings) ||
                                'px-6 py-4 whitespace-nowrap text-sm text-gray-500'
                              }
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
            <div
              className="mb-4"
              dangerouslySetInnerHTML={{
                __html: typeof props?.content === 'string' ? props.content : '',
              }}
            />
          );

        case 'decisionTree':
          console.warn(
            "'decisionTree' component type is deprecated. Use actions with branches instead."
          );
          return <></>;

        case 'array':
          return renderArrayField(component, fieldId);

        case 'confirmation':
          return (
            <FormConfirmationField
              fieldId={prefixedFieldId}
              label={label}
              formValues={formValues}
              formComponents={getAllFormComponents()}
              props={processPropsWithTemplates(props)}
              classes={getFieldClasses(settings)}
              colorClasses={settings.colorClasses}
              styleClasses={settings.styleClasses}
            />
          );

        case 'slider-range':
          return (
            <FormSliderRangeField
              fieldId={prefixedFieldId}
              label={translatedLabel}
              value={
                formValues[fieldId] !== undefined &&
                formValues[fieldId] !== null
                  ? (formValues[fieldId] as
                      | number
                      | { min: number; max: number })
                  : props?.mode === 'range'
                  ? { min: props?.min ?? 0, max: props?.max ?? 100 }
                  : props?.min ?? 0
              }
              onChange={(value) => handleInputChange(fieldId, value)}
              onBlur={() => handleBlur(fieldId)}
              validation={translatedValidation}
              expression={translatedProps?.expression}
              props={{
                ...processPropsWithTemplates(translatedProps),
              }}
              showError={showError}
              validationErrors={validationErrors[fieldId] || []}
              disabled={disabled}
              classes={getFieldClasses(settings)}
              colorClasses={settings.colorClasses}
              styleClasses={settings.styleClasses}
            />
          );

        default:
          return (
            <div
              className={
                getMergedClasses('unsupportedComponent', settings) ||
                'text-sm text-gray-500'
              }
            >
              Unsupported component type: {type}
            </div>
          );
      }
    },
    [
      translationService,
      currentStepIndex,
      formValues,
      validationErrors,
      disabled,
      settings,
      prefixId,
      handleInputChange,
      handleBlur,
      processPropsWithTemplates,
      shouldShowError,
      getPrefixedId,
    ]
  );

  const renderArrayItemComponent = (
    comp: FormComponentFieldProps,
    arrayFieldId: string,
    itemIndex: number
  ): React.ReactElement => {
    const fieldId = `${arrayFieldId}[${itemIndex}].${comp.id}`;
    const prefixedFieldId = getPrefixedId(fieldId);
    const hasError = validationErrors[fieldId]?.length > 0;
    const showError = shouldShowError(fieldId) && hasError;

    // Get the current value from the array item
    const arrayValue =
      (formValues[arrayFieldId] as Array<Record<string, unknown>>) || [];
    const itemValue = arrayValue[itemIndex] || {};
    const currentValue = itemValue[comp.id];

    // Get translated values
    const translatedLabel = translationService.translateComponent(
      comp.id,
      currentStepIndex,
      'label',
      comp.label
    );
    const translatedProps: any = {
      ...comp.props,
      ...(comp.expression && { expression: comp.expression }),
      ...(comp.props?.expression && { expression: comp.props.expression }),
    };

    // Handle translated options for select/radio components
    if (
      (comp.type === 'select' || comp.type === 'radio') &&
      comp.props?.options &&
      Array.isArray(comp.props.options)
    ) {
      translatedProps.options = comp.props.options.map(
        (option: any, index: number) => ({
          ...option,
          label: translationService.translateComponent(
            comp.id,
            currentStepIndex,
            `props.options.${index}.label`,
            option.label
          ),
        })
      );
    }

    // Handle translated validation messages
    const translatedValidation = comp.validation
      ? {
          ...comp.validation,
          errorMessages: comp.validation.errorMessages
            ? Object.fromEntries(
                Object.entries(comp.validation.errorMessages).map(
                  ([key, message]) => [
                    key,
                    translationService.translateComponent(
                      comp.id,
                      currentStepIndex,
                      `validation.errorMessages.${key}`,
                      message as string
                    ),
                  ]
                )
              )
            : undefined,
        }
      : undefined;

    switch (comp.type) {
      case 'input':
        return (
          <FormInputField
            fieldId={prefixedFieldId}
            label={translatedLabel}
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(value) =>
              handleArrayItemChange(arrayFieldId, itemIndex, comp.id, value)
            }
            onBlur={() => handleBlur(fieldId)}
            validation={translatedValidation}
            expression={translatedProps?.expression}
            props={{
              ...processPropsWithTemplates(translatedProps),
            }}
            showError={showError}
            validationErrors={validationErrors[fieldId] || []}
            disabled={disabled}
            // Array item field props
            isArrayItem={true}
            arrayItemChangeHandler={handleArrayItemChange}
            classes={getFieldClasses(settings)}
            colorClasses={settings.colorClasses}
            styleClasses={settings.styleClasses}
          />
        );

      case 'textarea':
        return (
          <FormTextareaField
            fieldId={prefixedFieldId}
            label={translatedLabel}
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(value) =>
              handleArrayItemChange(arrayFieldId, itemIndex, comp.id, value)
            }
            onBlur={() => handleBlur(fieldId)}
            validation={translatedValidation}
            expression={translatedProps?.expression}
            props={{
              ...processPropsWithTemplates(translatedProps),
            }}
            showError={showError}
            validationErrors={validationErrors[fieldId] || []}
            disabled={disabled}
            classes={getFieldClasses(settings)}
            colorClasses={settings.colorClasses}
            styleClasses={settings.styleClasses}
          />
        );

      case 'select':
        return (
          <FormSelectField
            fieldId={prefixedFieldId}
            label={translatedLabel}
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(value) =>
              handleArrayItemChange(arrayFieldId, itemIndex, comp.id, value)
            }
            onBlur={() => handleBlur(fieldId)}
            validation={translatedValidation}
            props={processPropsWithTemplates(translatedProps)}
            showError={showError}
            validationErrors={validationErrors[fieldId] || []}
            disabled={disabled}
            classes={getFieldClasses(settings)}
            colorClasses={settings.colorClasses}
            styleClasses={settings.styleClasses}
          />
        );

      case 'radio':
        return (
          <FormRadioField
            fieldId={prefixedFieldId}
            label={translatedLabel}
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(value) =>
              handleArrayItemChange(arrayFieldId, itemIndex, comp.id, value)
            }
            validation={translatedValidation}
            props={processPropsWithTemplates(translatedProps)}
            showError={showError}
            validationErrors={validationErrors[fieldId] || []}
            disabled={disabled}
            classes={getFieldClasses(settings)}
            colorClasses={settings.colorClasses}
            styleClasses={settings.styleClasses}
          />
        );

      case 'checkbox':
        return (
          <FormCheckboxField
            fieldId={prefixedFieldId}
            label={translatedLabel}
            value={currentValue as boolean | string[]}
            onChange={(value) =>
              handleArrayItemChange(arrayFieldId, itemIndex, comp.id, value)
            }
            onBlur={() => handleBlur(fieldId)}
            validation={translatedValidation}
            props={processPropsWithTemplates(translatedProps)}
            showError={showError}
            validationErrors={validationErrors[fieldId] || []}
            disabled={disabled}
            classes={getFieldClasses(settings)}
            colorClasses={settings.colorClasses}
            styleClasses={settings.styleClasses}
          />
        );

      case 'date':
        return (
          <FormDateField
            fieldId={prefixedFieldId}
            label={translatedLabel}
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(value) =>
              handleArrayItemChange(arrayFieldId, itemIndex, comp.id, value)
            }
            onBlur={() => handleBlur(fieldId)}
            validation={translatedValidation}
            props={processPropsWithTemplates(translatedProps)}
            showError={showError}
            validationErrors={validationErrors[fieldId] || []}
            disabled={disabled}
            classes={getFieldClasses(settings)}
            colorClasses={settings.colorClasses}
            styleClasses={settings.styleClasses}
          />
        );

      case 'slider-range':
        return (
          <FormSliderRangeField
            fieldId={prefixedFieldId}
            label={translatedLabel}
            value={
              currentValue !== undefined && currentValue !== null
                ? (currentValue as number | { min: number; max: number })
                : comp.props?.mode === 'range'
                ? { min: comp.props?.min ?? 0, max: comp.props?.max ?? 100 }
                : comp.props?.min ?? 0
            }
            onChange={(value) =>
              handleArrayItemChange(arrayFieldId, itemIndex, comp.id, value)
            }
            onBlur={() => handleBlur(fieldId)}
            validation={translatedValidation}
            expression={translatedProps?.expression}
            props={{
              ...processPropsWithTemplates(translatedProps),
            }}
            showError={showError}
            validationErrors={validationErrors[fieldId] || []}
            disabled={disabled}
            classes={getFieldClasses(settings)}
            colorClasses={settings.colorClasses}
            styleClasses={settings.styleClasses}
          />
        );

      default:
        return (
          <div
            className={
              getMergedClasses('unsupportedArrayComponent', settings) ||
              'text-sm text-gray-500'
            }
          >
            Unsupported array item component type: {comp.type}
          </div>
        );
    }
  };

  const renderArrayField = (
    component: FormComponentFieldProps,
    fieldId: string
  ): React.ReactElement => {
    const items = (formValues[fieldId] as Array<Record<string, unknown>>) || [];
    const prefixedFieldId = getPrefixedId(fieldId);
    const showError =
      shouldShowError(fieldId) && validationErrors[fieldId]?.length > 0;

    const handleAddItem = () => {
      const newItem: Record<string, unknown> = {};
      component.arrayItems?.forEach((arrayItem) => {
        arrayItem.components.forEach((comp) => {
          newItem[comp.id] = undefined;
        });
      });
      const newItems = [...items, newItem];
      handleInputChange(fieldId, newItems);
    };

    const handleRemoveItem = (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      handleInputChange(fieldId, newItems);
    };

    return (
      <div className="mb-4">
        <label
          htmlFor={prefixedFieldId}
          className={
            getMergedClasses('fieldLabel', settings) ||
            'block text-sm font-medium text-gray-700 mb-1'
          }
        >
          {typeof component.label === 'string' ? component.label : ''}
          {!!component.validation?.required && (
            <span
              className={
                getMergedClasses('requiredIndicator', settings) ||
                'text-red-500 ml-1'
              }
            >
              *
            </span>
          )}
        </label>
        {showError && (
          <div
            className={
              getMergedClasses('fieldError', settings) ||
              'mt-1 text-sm text-red-500'
            }
          >
            {validationErrors[fieldId].map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}
        {typeof component.props?.helperText === 'string' &&
          component.props.helperText.trim() !== '' &&
          !showError && (
            <p
              className={
                getMergedClasses('fieldHelperText', settings) ||
                'mt-1 text-sm text-gray-500'
              }
            >
              {component.props.helperText}
            </p>
          )}
        {items.map((_, index) => (
          <div
            key={index}
            className={
              getMergedClasses('arrayItemContainer', settings) ||
              'flex items-center mb-2'
            }
          >
            <div className="flex-1">
              {component.arrayItems?.map((arrayItem) => (
                <div key={arrayItem.id} className="mb-2">
                  {arrayItem.components.map((comp) => (
                    <div
                      key={comp.id}
                      className={
                        getMergedClasses('arrayItemField', settings) || 'mb-2'
                      }
                    >
                      {renderArrayItemComponent(comp, fieldId, index)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              className={`ml-2 text-red-600 hover:text-red-800 ${
                disabled ? 'cursor-not-allowed opacity-50' : ''
              }`}
              disabled={disabled}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddItem}
          className={`mt-2 text-sm text-blue-600 hover:text-blue-800 ${
            disabled ? 'cursor-not-allowed opacity-50' : ''
          }`}
          disabled={disabled}
        >
          Add Item
        </button>
      </div>
    );
  };

  const renderThankYouPage = (): React.ReactElement => {
    const thankYouPage = formJson.app.thankYouPage;
    if (!thankYouPage) {
      return (
        <div
          className={
            getMergedClasses('thankYouNotConfigured', settings) ||
            'p-4 text-red-500'
          }
        >
          Thank you page not configured
        </div>
      );
    }

    return (
      <div className="w-full">
        <div
          className={
            getMergedClasses('thankYouContainer', settings) ||
            'mb-4 p-4 rounded-md'
          }
        >
          <h1
            className={
              getMergedClasses('thankYouTitle', settings) ||
              'text-2xl font-bold text-green-700'
            }
          >
            {translationService.translateApp('title', thankYouPage.title) ||
              translationService.translateUI('thankYouTitle')}
          </h1>
        </div>

        <div
          className={
            getMergedClasses('thankYouMessageContainer', settings) ||
            'rounded-md shadow-sm p-6'
          }
        >
          {thankYouPage.message && (
            <div className="mb-6">
              <p
                className={
                  getMergedClasses('thankYouMessage', settings) ||
                  'text-lg text-gray-700 leading-relaxed'
                }
              >
                {thankYouPage.message}
              </p>
            </div>
          )}

          {thankYouPage.components && thankYouPage.components.length > 0 && (
            <div className="mb-6">
              {thankYouPage.components.map((component, index) => (
                <div key={index}>{renderComponent(component)}</div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-4 justify-center">
            {thankYouPage.showRestartButton && (
              <button
                type="button"
                onClick={() => handleThankYouAction('restart')}
                className={
                  getMergedClasses('thankYouButton', settings) ||
                  'px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors'
                }
              >
                {translationService.translateUI('restartButton')}
              </button>
            )}

            {thankYouPage.customActions?.map((action, index) => (
              <button
                key={index}
                type="button"
                onClick={() =>
                  handleThankYouAction(action.action, action.customAction)
                }
                className={`px-6 py-2 rounded-md transition-colors ${
                  action.className || 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
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
      <div
        key={page.id}
        className={
          getMergedClasses('page', settings) ||
          'bg-white rounded-md shadow-sm p-6'
        }
      >
        <h2
          className={
            getMergedClasses('pageTitle', settings) || 'text-xl font-bold mb-6'
          }
        >
          {translationService.translatePage(
            currentStepIndex,
            'title',
            page.title
          )}
        </h2>
        <div className={`${page.layout ? `grid ${layoutClass}` : ''}`}>
          {Array.isArray(page.components) &&
            page.components.map((component, index) => (
              <div key={index}>{renderComponent(component)}</div>
            ))}
        </div>
      </div>
    );
  };

  // Generate theme styles object
  const themeStyles = useMemo(() => {
    if (!settings.theme) return {};

    const styles: Record<string, string> = {};

    if (settings.theme.colors) {
      if (settings.theme.colors.primary)
        styles['--color-primary'] = settings.theme.colors.primary;
      if (settings.theme.colors.secondary)
        styles['--color-secondary'] = settings.theme.colors.secondary;
      if (settings.theme.colors.error)
        styles['--color-error'] = settings.theme.colors.error;
      if (settings.theme.colors.success)
        styles['--color-success'] = settings.theme.colors.success;
      if (settings.theme.colors.background)
        styles['--color-background'] = settings.theme.colors.background;
      if (settings.theme.colors.text)
        styles['--color-text'] = settings.theme.colors.text;
      if (settings.theme.colors.border)
        styles['--color-border'] = settings.theme.colors.border;
    }

    if (settings.theme.spacing) {
      if (settings.theme.spacing.xs)
        styles['--spacing-xs'] = settings.theme.spacing.xs;
      if (settings.theme.spacing.sm)
        styles['--spacing-sm'] = settings.theme.spacing.sm;
      if (settings.theme.spacing.md)
        styles['--spacing-md'] = settings.theme.spacing.md;
      if (settings.theme.spacing.lg)
        styles['--spacing-lg'] = settings.theme.spacing.lg;
    }

    return styles;
  }, [settings.theme]);

  return (
    <ExpressionContextProvider
      formValues={formValues}
      validation={validation}
      required={required}
      errors={Object.fromEntries(
        Object.entries(validationErrors).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(', ') : value,
        ])
      )}
      metadata={{
        currentStep: getCurrentStep().currentStep,
        totalSteps: getCurrentStep().totalSteps,
        isSubmitted,
        disabled,
      }}
    >
      <div
        className={getMergedClasses('container', settings) || 'w-full'}
        style={themeStyles}
      >
        {/* Check for invalid form data */}
        {!formJson || !formJson.app ? (
          <div
            className={
              getMergedClasses('invalidFormData', settings) ||
              'p-4 text-red-500'
            }
          >
            {translationService.translateUI('invalidFormData')}
          </div>
        ) : showThankYouPage ? (
          renderThankYouPage()
        ) : (
          <>
            <div
              className={
                getMergedClasses('header', settings) ||
                'mb-4 bg-indigo-50 p-4 rounded-md'
              }
            >
              <h1
                className={
                  getMergedClasses('headerTitle', settings) ||
                  'text-2xl font-bold text-indigo-700'
                }
              >
                {translationService.translateApp('title', formJson.app.title)}
              </h1>
              {Array.isArray(formJson.app.pages) &&
                formJson.app.pages.length > 1 &&
                !disabled && (
                  <div
                    className={
                      getMergedClasses('header', settings) ||
                      'mt-2 text-sm text-indigo-500'
                    }
                  >
                    {translationService.translateUI('multiPageInfo', {
                      pageCount: getLogicalPageCount(logicalPageOrder),
                    })}
                  </div>
                )}
            </div>

            <div className="space-y-8">{renderMultiStepForm()}</div>

            {hasSubmissions && !disabled && settings.showFormSubmissions && (
              <div
                className={
                  getMergedClasses('submissionsContainer', settings) ||
                  'mt-8 border-t pt-6'
                }
              >
                <h3
                  className={
                    getMergedClasses('submissionsTitle', settings) ||
                    'text-lg font-medium mb-4'
                  }
                >
                  {translationService.translateUI('submissionsTitle')}
                </h3>
                <div
                  className={
                    getMergedClasses('submissionsData', settings) ||
                    'bg-gray-50 p-4 rounded-md'
                  }
                >
                  {renderSubmissionData()}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ExpressionContextProvider>
  );
};
