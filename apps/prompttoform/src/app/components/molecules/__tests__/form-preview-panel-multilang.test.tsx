import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormPreviewPanel } from '../FormPreviewPanel';
import { UIJson } from '../../../types/form-generator.types';
import { ViewMode } from '../AppStateManager';

// Mock the FormRenderer component
vi.mock('@devhelpr/react-forms', () => ({
  FormRenderer: ({ formJson, settings, onPageChange }: any) => (
    <div data-testid="form-renderer">
      <div data-testid="form-title">{formJson.app?.title}</div>
      <div data-testid="form-language">{settings?.currentLanguage || 'en'}</div>
    </div>
  ),
  LanguageSelector: ({
    availableLanguages,
    languageDetails,
    currentLanguage,
    onLanguageChange,
  }: any) => (
    <select
      data-testid="language-selector"
      value={currentLanguage}
      onChange={(e) => onLanguageChange?.(e.target.value)}
    >
      {availableLanguages?.map((lang: string) => {
        const langDetail = languageDetails?.find((ld: any) => ld.code === lang);
        const displayName = langDetail?.nativeName || langDetail?.name || lang;
        return (
          <option key={lang} value={lang}>
            {displayName}
          </option>
        );
      })}
    </select>
  ),
}));

// Mock other components
vi.mock('../FormFlowMermaid', () => ({
  default: () => <div data-testid="form-flow">Form Flow</div>,
}));

vi.mock('../JsonValidator', () => ({
  JsonValidator: () => <div data-testid="json-validator">JSON Validator</div>,
}));

describe('FormPreviewPanel - Multi-Language Integration', () => {
  const mockFormJson: UIJson = {
    app: {
      title: 'Test Form',
    },
    pages: [
      {
        id: 'page1',
        title: 'Page 1',
        components: [
          {
            id: 'field1',
            type: 'text',
            label: 'Name',
            props: {
              placeholder: 'Enter your name',
            },
          },
        ],
      },
    ],
  };

  const mockMultiLanguageFormJson: UIJson = {
    app: {
      title: 'Test Form',
    },
    pages: [
      {
        id: 'page1',
        title: 'Page 1',
        components: [
          {
            id: 'field1',
            type: 'text',
            label: 'Name',
            props: {
              placeholder: 'Enter your name',
            },
          },
        ],
      },
    ],
    translations: {
      es: {
        app: { title: 'Formulario de Prueba' },
        pages: [
          {
            id: 'page1',
            title: 'Página 1',
            components: [
              {
                id: 'field1',
                label: 'Nombre',
                props: { placeholder: 'Ingrese su nombre' },
              },
            ],
          },
        ],
      },
      fr: {
        app: { title: 'Formulaire de Test' },
        pages: [
          {
            id: 'page1',
            title: 'Page 1',
            components: [
              {
                id: 'field1',
                label: 'Nom',
                props: { placeholder: 'Entrez votre nom' },
              },
            ],
          },
        ],
      },
    },
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es', 'fr'],
    languageDetails: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
    ],
  };

  const defaultProps = {
    parsedJson: mockFormJson,
    activeTab: 'form' as ViewMode,
    onTabChange: vi.fn(),
    onJsonChange: vi.fn(),
    generatedJson: JSON.stringify(mockFormJson),
    onCopyToClipboard: vi.fn(),
    onDownload: vi.fn(),
    onExportSchema: vi.fn(),
    isZipDownloading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not show language selector for single-language forms', () => {
    render(<FormPreviewPanel {...defaultProps} />);

    expect(screen.queryByTestId('language-selector')).not.toBeInTheDocument();
    expect(screen.queryByText('Language:')).not.toBeInTheDocument();
  });

  it('should show language selector for multi-language forms', () => {
    render(
      <FormPreviewPanel
        {...defaultProps}
        parsedJson={mockMultiLanguageFormJson}
      />
    );

    expect(screen.getByTestId('language-selector')).toBeInTheDocument();
    expect(screen.getByText('Language:')).toBeInTheDocument();
  });

  it('should display native language names in selector', () => {
    render(
      <FormPreviewPanel
        {...defaultProps}
        parsedJson={mockMultiLanguageFormJson}
      />
    );

    const selector = screen.getByTestId('language-selector');
    expect(selector).toBeInTheDocument();

    // Check that native names are displayed
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
    expect(screen.getByText('Français')).toBeInTheDocument();
  });

  it('should default to defaultLanguage when available', () => {
    render(
      <FormPreviewPanel
        {...defaultProps}
        parsedJson={mockMultiLanguageFormJson}
      />
    );

    const selector = screen.getByTestId(
      'language-selector'
    ) as HTMLSelectElement;
    expect(selector.value).toBe('en');
  });

  it('should call onLanguageChange when language is selected', async () => {
    const onLanguageChange = vi.fn();

    render(
      <FormPreviewPanel
        {...defaultProps}
        parsedJson={mockMultiLanguageFormJson}
        onLanguageChange={onLanguageChange}
      />
    );

    const selector = screen.getByTestId(
      'language-selector'
    ) as HTMLSelectElement;

    fireEvent.change(selector, { target: { value: 'es' } });

    await waitFor(() => {
      expect(onLanguageChange).toHaveBeenCalledWith('es');
    });
  });

  it('should update FormRenderer with selected language', async () => {
    const onLanguageChange = vi.fn();

    const { rerender } = render(
      <FormPreviewPanel
        {...defaultProps}
        parsedJson={mockMultiLanguageFormJson}
        currentLanguage="en"
        onLanguageChange={onLanguageChange}
      />
    );

    // Initially should show 'en'
    expect(screen.getByTestId('form-language')).toHaveTextContent('en');

    // Change language to 'es'
    rerender(
      <FormPreviewPanel
        {...defaultProps}
        parsedJson={mockMultiLanguageFormJson}
        currentLanguage="es"
        onLanguageChange={onLanguageChange}
      />
    );

    // Should now show 'es'
    expect(screen.getByTestId('form-language')).toHaveTextContent('es');
  });

  it('should handle forms without languageDetails gracefully', () => {
    const formWithoutLanguageDetails = {
      ...mockMultiLanguageFormJson,
      languageDetails: undefined,
    };

    render(
      <FormPreviewPanel
        {...defaultProps}
        parsedJson={formWithoutLanguageDetails}
      />
    );

    // Should still show language selector but use language codes
    expect(screen.getByTestId('language-selector')).toBeInTheDocument();

    const selector = screen.getByTestId(
      'language-selector'
    ) as HTMLSelectElement;
    expect(selector.value).toBe('en');
  });

  it('should not show language selector when activeTab is not form', () => {
    render(
      <FormPreviewPanel
        {...defaultProps}
        parsedJson={mockMultiLanguageFormJson}
        activeTab="json"
      />
    );

    expect(screen.queryByTestId('language-selector')).not.toBeInTheDocument();
  });

  it('should show language selector only in form preview tab', () => {
    const { rerender } = render(
      <FormPreviewPanel
        {...defaultProps}
        parsedJson={mockMultiLanguageFormJson}
        activeTab="form"
      />
    );

    expect(screen.getByTestId('language-selector')).toBeInTheDocument();

    // Switch to JSON tab
    rerender(
      <FormPreviewPanel
        {...defaultProps}
        parsedJson={mockMultiLanguageFormJson}
        activeTab="json"
      />
    );

    expect(screen.queryByTestId('language-selector')).not.toBeInTheDocument();

    // Switch back to form tab
    rerender(
      <FormPreviewPanel
        {...defaultProps}
        parsedJson={mockMultiLanguageFormJson}
        activeTab="form"
      />
    );

    expect(screen.getByTestId('language-selector')).toBeInTheDocument();
  });
});
