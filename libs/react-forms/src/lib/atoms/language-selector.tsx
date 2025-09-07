import React from 'react';

interface LanguageSelectorProps {
  currentLanguage: string;
  availableLanguages: string[];
  onLanguageChange: (language: string) => void;
  className?: string;
  languageDetails?: Array<{
    code: string;
    name: string;
    nativeName: string;
  }>;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  availableLanguages,
  onLanguageChange,
  className = '',
  languageDetails,
}) => {
  // Get language display name from provided details or fallback to language code
  const getLanguageDisplayName = (langCode: string): string => {
    if (languageDetails) {
      const langDetail = languageDetails.find((l) => l.code === langCode);
      if (langDetail && langDetail.name && langDetail.nativeName) {
        return `${langDetail.nativeName} (${langDetail.name})`;
      }
    }
    return langCode.toUpperCase();
  };

  if (availableLanguages.length <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <label
        htmlFor="language-selector"
        className="text-sm font-medium text-gray-700"
      >
        Language:
      </label>
      <select
        id="language-selector"
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label="Select language"
      >
        {availableLanguages.map((lang) => (
          <option key={lang} value={lang}>
            {getLanguageDisplayName(lang)}
          </option>
        ))}
      </select>
    </div>
  );
};
