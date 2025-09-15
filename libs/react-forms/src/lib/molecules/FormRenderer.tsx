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
} from '../atoms';
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
import { getClassNames, mergeClassNames, getText } from '../utils/class-utils';

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
  const [blurredFields, setBlurredFields] = useState<Record<string, boolean>>(
    {}
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepHistory, setStepHistory] = useState<number[]>([0]);
  const [formSubmissions, setFormSubmissions] = useState<
    Record<string, FormValues>
  >({});
  const [arrayItems, setArrayItems] = useState<
    Record<string, Record<string, unknown>[]>
  >({});
  const [showThankYouPage, setShowThankYouPage] = useState(false);
  const initialEventTriggeredRef = useRef(false);

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
      const totalPages = formJson.app.pages.length;

      const event: PageChangeEvent = {
        pageId: newPage.id,
        pageIndex: newPageIndex,
        pageTitle: newPage.title,
        totalPages,
        isFirstPage: newPageIndex === 0,
        isLastPage: newPageIndex === totalPages - 1,
        isEndPage: newPage.isEndPage === true,
        isConfirmationPage: newPage.isConfirmationPage === true,
        previousPageId: previousPage?.id,
        previousPageIndex: previousPageIndex,
      };

      onPageChange(event);
    },
    [onPageChange, formJson]
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
    if (!formJson || !formJson.app) return true;

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
    validateForm();
  }, [validateForm]);

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
      !initialEventTriggeredRef.current
    ) {
      const initialPage = formJson.app.pages[0];
      const totalPages = formJson.app.pages.length;

      const event: PageChangeEvent = {
        pageId: initialPage.id,
        pageIndex: 0,
        pageTitle: initialPage.title,
        totalPages,
        isFirstPage: true,
        isLastPage: totalPages === 1,
        isEndPage: initialPage.isEndPage === true,
        isConfirmationPage: initialPage.isConfirmationPage === true,
        previousPageId: undefined,
        previousPageIndex: undefined,
      };

      onPageChange(event);
      initialEventTriggeredRef.current = true;
    }
  }, [onPageChange, formJson?.app?.pages]);

  const handleInputChange = (id: string, value: unknown) => {
    setFormValues((prev) => ({
      ...prev,
      [id]: value,
    }));
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

      // If no specific next page is defined, move to the next page in sequence
      const totalSteps = formJson.app.pages?.length || 0;
      if (currentStepIndex < totalSteps - 1) {
        const nextIndex = currentStepIndex + 1;
        setStepHistory((prev) => [...prev, nextIndex]);
        setCurrentStepIndex(nextIndex);
        triggerPageChangeEvent(nextIndex, currentStepIndex);
        setIsSubmitted(false);
      } else {
        handleFormSubmit('multistep-form');
      }
    }
  }, [formJson, currentStepIndex, validateForm, getNextPage, handleFormSubmit]);

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
    // Use the state value instead of hardcoding
    const totalSteps = formJson.app.pages?.length || 0;
    const currentStep = currentStepIndex + 1; // Convert to 1-indexed for display

    return { currentStep, totalSteps };
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
        className={getClassNames(
          'mb-4 flex items-center justify-between',
          settings.classes?.stepIndicator
        )}
      >
        <div
          className={getClassNames(
            'text-sm font-medium text-gray-700',
            settings.classes?.stepIndicatorItem
          )}
        >
          {translationService.translateUI('stepIndicator', {
            currentStep,
            totalSteps,
          })}
        </div>
        <div
          className={getClassNames(
            'w-2/3 bg-gray-200 rounded-full h-2.5',
            settings.classes?.stepIndicator
          )}
        >
          <div
            className={getClassNames(
              'bg-indigo-600 h-2.5 rounded-full',
              settings.classes?.stepIndicatorActive
            )}
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

    const currentPage = formJson.app.pages[currentStep - 1];
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
        const nextPage = formJson.app.pages[nextPageIndex];
        if (nextPage && nextPage.isConfirmationPage) {
          nextButtonText = translationService.translateUI(
            'reviewConfirmButton'
          );
        }
      }
    }

    return (
      <div
        className={getClassNames(
          'mt-6 flex justify-between',
          settings.classes?.navigationButtons
        )}
      >
        <button
          type="button"
          className={getClassNames(
            `px-4 py-2 border border-indigo-300 text-indigo-700 rounded-md ${
              currentStep === 1
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-indigo-50'
            }`,
            settings.classes?.previousButton
          )}
          disabled={currentStep === 1}
          onClick={handlePrevious}
        >
          {translationService.translateUI('previousButton')}
        </button>
        <button
          type="button"
          className={getClassNames(
            'px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700',
            settings.classes?.nextButton
          )}
          onClick={handleNext}
        >
          {nextButtonText}
        </button>
      </div>
    );
  };

  const renderMultiStepForm = (): React.ReactElement => {
    if (!formJson.app.pages || formJson.app.pages.length === 0) {
      return (
        <div className="p-4 text-red-500">
          {translationService.translateUI('noPagesDefined')}
        </div>
      );
    }

    const { currentStep, totalSteps } = getCurrentStep();
    const currentPageIndex = currentStep - 1;

    if (currentPageIndex < 0 || currentPageIndex >= formJson.app.pages.length) {
      return (
        <div className="p-4 text-red-500">
          {translationService.translateUI('invalidPageIndex')}
        </div>
      );
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
      return (
        <div className="text-gray-500 italic">
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

    const extractComponents = (components: FormComponentFieldProps[]) => {
      components.forEach((component) => {
        allComponents.push(component);
        if (component.children) {
          extractComponents(component.children);
        }
        if (component.arrayItems) {
          component.arrayItems.forEach((arrayItem) => {
            if (arrayItem.components) {
              extractComponents(arrayItem.components);
            }
          });
        }
      });
    };

    formJson.app.pages.forEach((page) => {
      if (page.components) {
        extractComponents(page.components);
      }
    });

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

      const { id, type, label, props, validation } = component;
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
      const translatedValidation = validation
        ? {
            ...validation,
            errorMessages: validation.errorMessages
              ? Object.fromEntries(
                  Object.entries(validation.errorMessages).map(
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
          return (
            <TextFormField
              label={translatedLabel}
              props={processPropsWithTemplates(translatedProps)}
              classes={{
                field: settings.classes?.field,
                fieldLabel: settings.classes?.fieldLabel,
                fieldText: settings.classes?.fieldText,
              }}
            />
          );

        case 'input':
          return (
            <FormInputField
              fieldId={prefixedFieldId}
              label={translatedLabel}
              value={
                typeof formValues[id] === 'string'
                  ? (formValues[id] as string)
                  : ''
              }
              onChange={(value) => handleInputChange(id, value)}
              onBlur={() => handleBlur(id)}
              validation={translatedValidation}
              props={processPropsWithTemplates(translatedProps)}
              showError={showError}
              validationErrors={validationErrors[fieldId] || []}
              disabled={disabled}
              classes={{
                field: settings.classes?.field,
                fieldLabel: settings.classes?.fieldLabel,
                fieldInput: settings.classes?.fieldInput,
                fieldError: settings.classes?.fieldError,
                fieldHelperText: settings.classes?.fieldHelperText,
              }}
            />
          );

        case 'textarea':
          return (
            <FormTextareaField
              fieldId={prefixedFieldId}
              label={translatedLabel}
              value={
                typeof formValues[id] === 'string'
                  ? (formValues[id] as string)
                  : ''
              }
              onChange={(value) => handleInputChange(id, value)}
              onBlur={() => handleBlur(id)}
              validation={translatedValidation}
              props={processPropsWithTemplates(translatedProps)}
              showError={showError}
              validationErrors={validationErrors[fieldId] || []}
              disabled={disabled}
              classes={{
                field: settings.classes?.field,
                fieldLabel: settings.classes?.fieldLabel,
                fieldTextarea: settings.classes?.fieldTextarea,
                fieldError: settings.classes?.fieldError,
                fieldHelperText: settings.classes?.fieldHelperText,
              }}
            />
          );

        case 'radio':
          return (
            <FormRadioField
              fieldId={prefixedFieldId}
              label={translatedLabel}
              value={
                typeof formValues[id] === 'string'
                  ? (formValues[id] as string)
                  : ''
              }
              onChange={(value) => handleInputChange(id, value)}
              validation={translatedValidation}
              props={processPropsWithTemplates(translatedProps)}
              showError={showError}
              validationErrors={validationErrors[fieldId] || []}
              disabled={disabled}
              classes={{
                field: settings.classes?.field,
                fieldLabel: settings.classes?.fieldLabel,
                fieldRadio: settings.classes?.fieldRadio,
                fieldError: settings.classes?.fieldError,
                fieldHelperText: settings.classes?.fieldHelperText,
              }}
            />
          );

        case 'checkbox':
          return (
            <FormCheckboxField
              fieldId={prefixedFieldId}
              label={translatedLabel}
              value={formValues[id] as boolean | string[]}
              onChange={(value) => handleInputChange(id, value)}
              onBlur={() => handleBlur(id)}
              validation={translatedValidation}
              props={processPropsWithTemplates(translatedProps)}
              showError={showError}
              validationErrors={validationErrors[fieldId] || []}
              disabled={disabled}
              classes={{
                field: settings.classes?.field,
                fieldLabel: settings.classes?.fieldLabel,
                fieldCheckbox: settings.classes?.fieldCheckbox,
                fieldError: settings.classes?.fieldError,
                fieldHelperText: settings.classes?.fieldHelperText,
              }}
            />
          );

        case 'select':
          return (
            <FormSelectField
              fieldId={prefixedFieldId}
              label={translatedLabel}
              value={
                typeof formValues[id] === 'string'
                  ? (formValues[id] as string)
                  : ''
              }
              onChange={(value) => handleInputChange(id, value)}
              onBlur={() => handleBlur(id)}
              validation={translatedValidation}
              props={processPropsWithTemplates(translatedProps)}
              showError={showError}
              validationErrors={validationErrors[fieldId] || []}
              disabled={disabled}
              classes={{
                field: settings.classes?.field,
                fieldLabel: settings.classes?.fieldLabel,
                fieldSelect: settings.classes?.fieldSelect,
                fieldError: settings.classes?.fieldError,
                fieldHelperText: settings.classes?.fieldHelperText,
              }}
            />
          );

        case 'date':
          return (
            <FormDateField
              fieldId={prefixedFieldId}
              label={translatedLabel}
              value={
                typeof formValues[id] === 'string'
                  ? (formValues[id] as string)
                  : ''
              }
              onChange={(value) => handleInputChange(id, value)}
              onBlur={() => handleBlur(id)}
              validation={translatedValidation}
              props={processPropsWithTemplates(translatedProps)}
              showError={showError}
              validationErrors={validationErrors[fieldId] || []}
              disabled={disabled}
              classes={{
                field: settings.classes?.field,
                fieldLabel: settings.classes?.fieldLabel,
                fieldDate: settings.classes?.fieldDate,
                fieldError: settings.classes?.fieldError,
                fieldHelperText: settings.classes?.fieldHelperText,
              }}
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
              classes={{
                field: settings.classes?.field,
                fieldLabel: settings.classes?.fieldLabel,
                noContentText:
                  translationService.translateUI('noContentInSection'),
              }}
            />
          );

        case 'form':
          return (
            <div className="mb-6">
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
                <thead className="bg-gray-50">
                  {Array.isArray(props?.headers) &&
                    props.headers.length > 0 && (
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
            />
          );

        case 'slider-range':
          return (
            <FormSliderRangeField
              fieldId={prefixedFieldId}
              label={translatedLabel}
              value={
                formValues[id] !== undefined && formValues[id] !== null
                  ? (formValues[id] as number | { min: number; max: number })
                  : props?.mode === 'range'
                  ? { min: props?.min ?? 0, max: props?.max ?? 100 }
                  : props?.min ?? 0
              }
              onChange={(value) => handleInputChange(id, value)}
              onBlur={() => handleBlur(id)}
              validation={translatedValidation}
              props={processPropsWithTemplates(translatedProps)}
              showError={showError}
              validationErrors={validationErrors[fieldId] || []}
              disabled={disabled}
              classes={{
                field: settings.classes?.field,
                fieldLabel: settings.classes?.fieldLabel,
                fieldSlider: settings.classes?.fieldSlider,
                fieldError: settings.classes?.fieldError,
                fieldHelperText: settings.classes?.fieldHelperText,
              }}
            />
          );

        default:
          return (
            <div className="text-sm text-gray-500">
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

  const renderArrayField = (
    component: FormComponentFieldProps,
    fieldId: string
  ): React.ReactElement => {
    const items = arrayItems[component.id] || [];
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
      setArrayItems((prev) => ({
        ...prev,
        [component.id]: newItems,
      }));
      handleInputChange(fieldId, newItems);
    };

    const handleRemoveItem = (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      setArrayItems((prev) => ({
        ...prev,
        [component.id]: newItems,
      }));
      handleInputChange(fieldId, newItems);
    };

    return (
      <div className="mb-4">
        <label
          htmlFor={prefixedFieldId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {typeof component.label === 'string' ? component.label : ''}
          {!!component.validation?.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
        {showError && (
          <div className="mt-1 text-sm text-red-500">
            {validationErrors[fieldId].map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}
        {typeof component.props?.helperText === 'string' &&
          component.props.helperText.trim() !== '' &&
          !showError && (
            <p className="mt-1 text-sm text-gray-500">
              {component.props.helperText}
            </p>
          )}
        {items.map((_, index) => (
          <div key={index} className="flex items-center mb-2">
            <div className="flex-1">
              {component.arrayItems?.map((arrayItem) => (
                <div key={arrayItem.id} className="mb-2">
                  {arrayItem.components.map((comp) => (
                    <div key={comp.id} className="mb-2">
                      {renderComponent(
                        {
                          ...comp,
                          id: `${component.id}[${index}].${comp.id}`,
                        },
                        `${fieldId}[${index}]`
                      )}
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
        <div className="p-4 text-red-500">Thank you page not configured</div>
      );
    }

    return (
      <div className="w-full">
        <div
          className={getClassNames(
            'mb-4 bg-green-50 p-4 rounded-md',
            settings.classes?.thankYouContainer
          )}
        >
          <h1
            className={getClassNames(
              'text-2xl font-bold text-green-700',
              settings.classes?.thankYouTitle
            )}
          >
            {translationService.translateApp('title', thankYouPage.title) ||
              translationService.translateUI('thankYouTitle')}
          </h1>
        </div>

        <div
          className={getClassNames(
            'bg-white rounded-md shadow-sm p-6',
            settings.classes?.thankYouContainer
          )}
        >
          {thankYouPage.message && (
            <div className="mb-6">
              <p
                className={getClassNames(
                  'text-lg text-gray-700 leading-relaxed',
                  settings.classes?.thankYouMessage
                )}
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
                className={getClassNames(
                  'px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors',
                  settings.classes?.thankYouButton
                )}
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
        className={getClassNames(
          'bg-white rounded-md shadow-sm p-6',
          settings.classes?.page
        )}
      >
        <h2
          className={getClassNames(
            'text-xl font-bold mb-6',
            settings.classes?.page
          )}
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
    <div
      className={getClassNames('w-full', settings.classes?.container)}
      style={themeStyles}
    >
      {/* Check for invalid form data */}
      {!formJson || !formJson.app ? (
        <div className="p-4 text-red-500">
          {translationService.translateUI('invalidFormData')}
        </div>
      ) : showThankYouPage ? (
        renderThankYouPage()
      ) : (
        <>
          <div
            className={getClassNames(
              'mb-4 bg-indigo-50 p-4 rounded-md',
              settings.classes?.header
            )}
          >
            <h1
              className={getClassNames(
                'text-2xl font-bold text-indigo-700',
                settings.classes?.header
              )}
            >
              {translationService.translateApp('title', formJson.app.title)}
            </h1>
            {Array.isArray(formJson.app.pages) &&
              formJson.app.pages.length > 1 &&
              !disabled && (
                <div
                  className={getClassNames(
                    'mt-2 text-sm text-indigo-500',
                    settings.classes?.header
                  )}
                >
                  {translationService.translateUI('multiPageInfo', {
                    pageCount: formJson.app.pages.length,
                  })}
                </div>
              )}
          </div>

          <div className="space-y-8">{renderMultiStepForm()}</div>

          {hasSubmissions && !disabled && settings.showFormSubmissions && (
            <div
              className={getClassNames(
                'mt-8 border-t pt-6',
                settings.classes?.submissionsContainer
              )}
            >
              <h3
                className={getClassNames(
                  'text-lg font-medium mb-4',
                  settings.classes?.submissionsTitle
                )}
              >
                {translationService.translateUI('submissionsTitle')}
              </h3>
              <div
                className={getClassNames(
                  'bg-gray-50 p-4 rounded-md',
                  settings.classes?.submissionsData
                )}
              >
                {renderSubmissionData()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
