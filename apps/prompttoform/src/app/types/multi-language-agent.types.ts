/**
 * Multi-language agent types and interfaces for Phase 2
 */

export interface MultiLanguageAnalysis {
  isMultiLanguageRequested: boolean;
  requestedLanguages: string[];
  confidence: number;
  reasoning: string;
  suggestedLanguages?: string[];
  languageDetails?: Array<{
    code: string;
    name: string;
    nativeName: string;
  }>;
}

export interface TranslationRequest {
  formJson: any; // UIJson type from react-forms
  targetLanguages: string[];
  sourceLanguage?: string;
  languageDetails?: Array<{
    code: string;
    name: string;
    nativeName: string;
  }>;
}

export interface TranslationResult {
  success: boolean;
  translations?: Record<string, any>; // TranslationDictionary type from react-forms
  errors?: string[];
  processingTime?: number;
}

export interface LanguageDetectionConfig {
  confidenceThreshold: number;
  enableFallback: boolean;
  maxLanguages: number;
  supportedLanguageCodes: string[];
}

export interface TranslationConfig {
  enableLLMTranslation: boolean;
  fallbackToEnglish: boolean;
  preserveFormatting: boolean;
  maxRetries: number;
  timeoutMs: number;
}

export interface MultiLanguageAgentState {
  multiLanguageAnalysis?: MultiLanguageAnalysis;
  translationResult?: TranslationResult;
  currentLanguage: string;
  availableLanguages: string[];
  languageDetails?: Array<{
    code: string;
    name: string;
    nativeName: string;
  }>;
}

export interface MultiLanguagePromptContext {
  originalPrompt: string;
  multiLanguageAnalysis: MultiLanguageAnalysis;
  formJson: any; // UIJson type from react-forms
  targetLanguages: string[];
  sourceLanguage: string;
}
