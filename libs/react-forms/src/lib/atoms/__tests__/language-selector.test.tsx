import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LanguageSelector } from '../language-selector';

describe('LanguageSelector', () => {
  const defaultProps = {
    currentLanguage: 'en',
    availableLanguages: ['en', 'es', 'fr'],
    onLanguageChange: vi.fn(),
  };

  const languageDetails = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render language selector with available languages', () => {
      render(<LanguageSelector {...defaultProps} />);

      expect(screen.getByLabelText('Language:')).toBeInTheDocument();
      expect(screen.getByDisplayValue('EN')).toBeInTheDocument();
    });

    it('should render with language details when provided', () => {
      render(
        <LanguageSelector {...defaultProps} languageDetails={languageDetails} />
      );

      expect(screen.getByDisplayValue('English (English)')).toBeInTheDocument();
    });

    it('should not render when only one language is available', () => {
      const singleLanguageProps = {
        ...defaultProps,
        availableLanguages: ['en'],
      };

      const { container } = render(
        <LanguageSelector {...singleLanguageProps} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should not render when no languages are available', () => {
      const noLanguageProps = {
        ...defaultProps,
        availableLanguages: [],
      };

      const { container } = render(<LanguageSelector {...noLanguageProps} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Language Display', () => {
    it('should display languages with native names when languageDetails provided', () => {
      render(
        <LanguageSelector {...defaultProps} languageDetails={languageDetails} />
      );

      const select = screen.getByRole('combobox');
      const options = Array.from(select.querySelectorAll('option'));

      expect(options[0]).toHaveTextContent('English (English)');
      expect(options[1]).toHaveTextContent('Español (Spanish)');
      expect(options[2]).toHaveTextContent('Français (French)');
    });

    it('should display languages as uppercase codes when no languageDetails provided', () => {
      render(<LanguageSelector {...defaultProps} />);

      const select = screen.getByRole('combobox');
      const options = Array.from(select.querySelectorAll('option'));

      expect(options[0]).toHaveTextContent('EN');
      expect(options[1]).toHaveTextContent('ES');
      expect(options[2]).toHaveTextContent('FR');
    });

    it('should handle missing language details gracefully', () => {
      const partialLanguageDetails = [
        { code: 'en', name: 'English', nativeName: 'English' },
        // Missing 'es' and 'fr' details
      ];

      render(
        <LanguageSelector
          {...defaultProps}
          languageDetails={partialLanguageDetails}
        />
      );

      const select = screen.getByRole('combobox');
      const options = Array.from(select.querySelectorAll('option'));

      expect(options[0]).toHaveTextContent('English (English)');
      expect(options[1]).toHaveTextContent('ES'); // Fallback to uppercase
      expect(options[2]).toHaveTextContent('FR'); // Fallback to uppercase
    });
  });

  describe('User Interaction', () => {
    it('should call onLanguageChange when language is selected', () => {
      render(<LanguageSelector {...defaultProps} />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'es' } });

      expect(defaultProps.onLanguageChange).toHaveBeenCalledWith('es');
    });

    it('should update selected value when currentLanguage changes', () => {
      const { rerender } = render(<LanguageSelector {...defaultProps} />);

      expect(screen.getByDisplayValue('EN')).toBeInTheDocument();

      rerender(<LanguageSelector {...defaultProps} currentLanguage="es" />);

      expect(screen.getByDisplayValue('ES')).toBeInTheDocument();
    });

    it('should maintain selection when languageDetails change', () => {
      const { rerender } = render(
        <LanguageSelector {...defaultProps} currentLanguage="es" />
      );

      expect(screen.getByDisplayValue('ES')).toBeInTheDocument();

      rerender(
        <LanguageSelector
          {...defaultProps}
          currentLanguage="es"
          languageDetails={languageDetails}
        />
      );

      expect(screen.getByDisplayValue('Español (Spanish)')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility attributes', () => {
      render(<LanguageSelector {...defaultProps} />);

      const select = screen.getByRole('combobox');
      const label = screen.getByText('Language:');

      expect(select).toHaveAttribute('id', 'language-selector');
      expect(label).toHaveAttribute('for', 'language-selector');
    });

    it('should have proper CSS classes', () => {
      render(<LanguageSelector {...defaultProps} className="custom-class" />);

      const container = screen.getByLabelText('Language:').closest('div');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty languageDetails array', () => {
      render(<LanguageSelector {...defaultProps} languageDetails={[]} />);

      const select = screen.getByRole('combobox');
      const options = Array.from(select.querySelectorAll('option'));

      expect(options[0]).toHaveTextContent('EN');
      expect(options[1]).toHaveTextContent('ES');
      expect(options[2]).toHaveTextContent('FR');
    });

    it('should handle undefined languageDetails', () => {
      render(
        <LanguageSelector {...defaultProps} languageDetails={undefined} />
      );

      const select = screen.getByRole('combobox');
      const options = Array.from(select.querySelectorAll('option'));

      expect(options[0]).toHaveTextContent('EN');
      expect(options[1]).toHaveTextContent('ES');
      expect(options[2]).toHaveTextContent('FR');
    });

    it('should handle malformed languageDetails', () => {
      const malformedDetails = [
        { code: 'en', name: 'English' }, // Missing nativeName
        { code: 'es', nativeName: 'Español' }, // Missing name
        { code: 'fr', name: 'French', nativeName: 'Français' }, // Complete
      ];

      render(
        <LanguageSelector
          {...defaultProps}
          languageDetails={malformedDetails}
        />
      );

      const select = screen.getByRole('combobox');
      const options = Array.from(select.querySelectorAll('option'));

      expect(options[0]).toHaveTextContent('EN'); // Fallback due to missing nativeName
      expect(options[1]).toHaveTextContent('ES'); // Fallback due to missing name
      expect(options[2]).toHaveTextContent('Français (French)'); // Complete details
    });
  });
});
