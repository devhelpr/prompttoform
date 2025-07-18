import { FormComponentFieldProps } from '@devhelpr/react-forms';

// Define the evaluation result type
export interface EvaluationResult {
  matchesPrompt: boolean;
  matchesSystemPrompt: boolean;
  missingElements: string[];
  suggestedHints: string[];
  score: number;
  reasoning: string;
}

// Define view modes
export type ViewMode = 'json' | 'form' | 'flow' | 'mermaid-flow';

// Define interface for JSON types
export interface UIJson {
  app: {
    title: string;
    pages: Array<{
      id: string;
      title: string;
      route: string;
      layout?: string;
      components: FormComponentFieldProps[];
      isEndPage?: boolean;
    }>;
    dataSources?: Array<{
      type: string;
      [key: string]: unknown;
    }>;
  };
}

// Form generator state interface
export interface FormGeneratorState {
  prompt: string;
  updatePrompt: string;
  isUpdating: boolean;
  updateError: string | null;
  generatedJson: string;
  parsedJson: UIJson | null;
  viewMode: ViewMode;
  isLoading: boolean;
  error: string | null;
  isSettingsOpen: boolean;
  evaluation: EvaluationResult | null;
  isEvaluating: boolean;
  jsonError: string | null;
  showApiKeyHint: boolean;
  piiErrors: {
    prompt?: string;
    updatePrompt?: string;
  };
  isZipDownloading: boolean;
  isDeploying: boolean;
  siteUrl: string;
  currentSessionId: string | null;
  showSessionHistory: boolean;
}

// Form generator props
export interface FormGeneratorProps {
  formJson: string;
  triggerDeploy: boolean;
}

// PII validation result
export interface PIIValidationResult {
  hasPII: boolean;
  warningMessage?: string;
}

// JSON formatting options
export interface JsonFormatOptions {
  indent?: number;
  replaceNewlines?: boolean;
  replaceBackslashes?: boolean;
}
