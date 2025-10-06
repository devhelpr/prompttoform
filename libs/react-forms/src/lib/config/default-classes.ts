import {
  FormRendererColorClasses,
  FormRendererStyleClasses,
} from '../interfaces/form-interfaces';

/**
 * Default color classes for form components
 * These classes control colors, backgrounds, borders, and text colors
 */
export const defaultColorClasses: FormRendererColorClasses = {
  // Layout Colors
  container: '',
  header: 'bg-indigo-50',
  headerTitle: 'text-indigo-700',
  page: 'bg-white',
  pageTitle: '',

  // Navigation Colors
  stepIndicator: 'bg-gray-200',
  stepIndicatorItem: 'text-gray-700',
  stepIndicatorActive: 'bg-indigo-600',
  navigationButtons: '',
  nextButton: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  previousButton: 'border-indigo-300 text-indigo-700',

  // Form Field Colors
  field: '',
  fieldLabel: 'text-gray-700',
  fieldInput: 'border-gray-300',
  fieldTextarea: 'border-gray-300',
  fieldSelect: 'border-gray-300 bg-white',
  fieldCheckbox: 'text-indigo-600 focus:ring-indigo-500',
  fieldRadio: 'text-indigo-600 focus:ring-indigo-500',
  fieldDate: 'border-gray-300',
  fieldSlider: 'bg-gray-200',
  fieldText: 'text-gray-700',
  fieldError: 'text-red-500',
  fieldHelperText: 'text-gray-500',

  // Special Component Colors
  confirmationField: '',
  arrayField: '',
  arrayItem: '',
  arrayAddButton: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  arrayRemoveButton: 'bg-red-600 hover:bg-red-700 text-white',

  // Submissions Colors
  submissionsContainer: '',
  submissionsTitle: '',
  submissionsData: 'bg-gray-50',

  // Thank You Page Colors
  thankYouContainer: 'bg-green-50',
  thankYouMessageContainer: 'bg-white',
  thankYouTitle: 'text-green-700',
  thankYouMessage: 'text-gray-700',
  thankYouButton: 'bg-indigo-600 hover:bg-indigo-700 text-white',
};

/**
 * Default style classes for form components
 * These classes control spacing, sizing, positioning, borders, shadows, etc.
 */
export const defaultStyleClasses: FormRendererStyleClasses = {
  // Layout Styles
  container: 'w-full',
  header: 'p-4 rounded-md',
  headerTitle: 'text-2xl font-bold',
  page: 'rounded-md shadow-sm p-6',
  pageTitle: 'text-xl font-bold mb-6',

  // Navigation Styles
  stepIndicator: 'w-2/3 rounded-full h-2.5',
  stepIndicatorItem: 'text-sm font-medium',
  stepIndicatorActive: 'h-2.5 rounded-full',
  navigationButtons: 'mt-6 flex justify-between',
  nextButton: 'px-4 py-2 rounded-md',
  previousButton: 'px-4 py-2 border rounded-md',

  // Form Field Styles
  field: 'mb-4',
  fieldLabel: 'block text-sm font-medium mb-1',
  fieldInput: 'w-full p-2 border rounded-md',
  fieldTextarea: 'w-full p-2 border rounded-md',
  fieldSelect: 'w-full p-2 border rounded-md',
  fieldCheckbox: 'h-4 w-4',
  fieldRadio: 'h-4 w-4',
  fieldDate: 'w-full p-2 border rounded-md',
  fieldSlider: 'relative h-6 rounded-lg cursor-pointer',
  fieldText: '',
  fieldError: 'mt-1 text-sm',
  fieldHelperText: 'mt-1 text-sm',

  // Special Component Styles
  confirmationField: '',
  arrayField: '',
  arrayItem: '',
  arrayAddButton: 'px-4 py-2 rounded-md',
  arrayRemoveButton: 'px-4 py-2 rounded-md',

  // Submissions Styles
  submissionsContainer: 'mt-8 border-t pt-6',
  submissionsTitle: 'text-lg font-medium mb-4',
  submissionsData: 'p-4 rounded-md',

  // Thank You Page Styles
  thankYouContainer: 'p-4 rounded-md',
  thankYouMessageContainer: 'rounded-md shadow-sm p-',
  thankYouTitle: 'text-2xl font-bold',
  thankYouMessage: 'text-lg leading-relaxed',
  thankYouButton: 'px-6 py-2 rounded-md transition-colors',
};

/**
 * Error state color classes
 * Applied when form fields have validation errors
 */
export const errorColorClasses: Partial<FormRendererColorClasses> = {
  fieldInput: 'border-red-500',
  fieldTextarea: 'border-red-500',
  fieldSelect: 'border-red-500',
  fieldDate: 'border-red-500',
};

/**
 * Disabled state color classes
 * Applied when form fields are disabled
 */
export const disabledColorClasses: Partial<FormRendererColorClasses> = {
  fieldInput: 'bg-gray-100 cursor-not-allowed',
  fieldTextarea: 'bg-gray-100 cursor-not-allowed',
  fieldSelect: 'bg-gray-100 cursor-not-allowed',
  fieldDate: 'bg-gray-100 cursor-not-allowed',
  fieldCheckbox: 'cursor-not-allowed opacity-50',
  fieldRadio: 'cursor-not-allowed opacity-50',
};

/**
 * Read-only state color classes
 * Applied when form fields are read-only
 */
export const readOnlyColorClasses: Partial<FormRendererColorClasses> = {
  fieldInput: 'bg-gray-50 cursor-not-allowed text-gray-900',
  fieldTextarea: 'bg-gray-50 cursor-not-allowed text-gray-900',
  fieldSelect: 'bg-gray-50 cursor-not-allowed text-gray-900',
  fieldDate: 'bg-gray-50 cursor-not-allowed text-gray-900',
};
