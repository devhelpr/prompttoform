import { BaseAgent } from './base-agent';
import { generateResponse } from '../llm-api';
import {
  MultiLanguageAnalysis,
  LanguageDetectionConfig,
} from '../../types/multi-language-agent.types';

export class MultiLanguageDetectionAgent extends BaseAgent {
  private config: LanguageDetectionConfig;

  constructor(config: LanguageDetectionConfig) {
    super('MultiLanguageDetectionAgent', '1.0.0');
    this.config = config;
  }

  protected getAgentType(): string {
    return 'multi-language-detection';
  }

  /**
   * Detect if a user prompt requests multi-language support
   */
  async detectMultiLanguageRequest(
    prompt: string
  ): Promise<MultiLanguageAnalysis> {
    return this.measureExecutionTime(async () => {
      try {
        const detectionPrompt = this.buildDetectionPrompt(prompt);
        const response = await generateResponse(detectionPrompt);
        return this.parseAnalysisResponse(response);
      } catch (error) {
        this.logError('detectMultiLanguageRequest', error);
        return this.getFallbackAnalysis(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }, 'detectMultiLanguageRequest').then(({ result }) => result);
  }

  /**
   * Build the prompt for multi-language detection
   */
  private buildDetectionPrompt(userPrompt: string): string {
    return `You are an expert at analyzing user prompts to detect multi-language requirements for forms.

Analyze the following prompt and determine:
1. Whether the user is requesting multi-language support
2. Which specific languages are mentioned or implied
3. Your confidence level in this assessment
4. Your reasoning for the decision
5. Language details including native names

User Prompt: "${userPrompt}"

Consider these indicators of multi-language requests:
- Explicit mentions of multiple languages (e.g., "English and Spanish", "in multiple languages")
- References to international users, global audience, or localization
- Mentions of specific language names or codes
- Requests for forms that need to serve diverse populations
- Terms like "bilingual", "multilingual", "translated", "localized"

Respond with a JSON object:
{
  "isMultiLanguageRequested": boolean,
  "requestedLanguages": string[],
  "confidence": number (0-1),
  "reasoning": string,
  "suggestedLanguages": string[] (optional),
  "languageDetails": [
    {
      "code": string (ISO 639-1 language code),
      "name": string (English name),
      "nativeName": string (how it's written in its native script)
    }
  ]
}

Language codes should follow ISO 639-1 format (e.g., "en", "es", "fr", "zh", "ja", "ko", "ar").
For regional variants, use format like "zh-CN", "pt-BR", "en-US".

If no multi-language is requested, set isMultiLanguageRequested to false and include only the default language (English).`;
  }

  /**
   * Parse the LLM response into a MultiLanguageAnalysis object
   */
  private parseAnalysisResponse(response: string): MultiLanguageAnalysis {
    const fallbackAnalysis: MultiLanguageAnalysis = {
      isMultiLanguageRequested: false,
      requestedLanguages: ['en'],
      confidence: 0,
      reasoning: 'Error parsing LLM response',
      languageDetails: [{ code: 'en', name: 'English', nativeName: 'English' }],
    };

    const parsed = this.parseJsonResponse(response, fallbackAnalysis);

    // Validate and clean the response
    const requestedLanguages = this.validateLanguageCodes(
      Array.isArray(parsed.requestedLanguages)
        ? parsed.requestedLanguages
        : ['en']
    );

    const languageDetails = this.getLanguageDetails(requestedLanguages);

    return {
      isMultiLanguageRequested: Boolean(parsed.isMultiLanguageRequested),
      requestedLanguages,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      reasoning: String(parsed.reasoning || 'No reasoning provided'),
      suggestedLanguages: Array.isArray(parsed.suggestedLanguages)
        ? this.validateLanguageCodes(parsed.suggestedLanguages)
        : undefined,
      languageDetails,
    };
  }

  /**
   * Validate and filter language codes
   */
  private validateLanguageCodes(codes: string[]): string[] {
    if (!Array.isArray(codes)) return ['en'];

    return codes
      .filter((code) => typeof code === 'string' && code.length > 0)
      .filter((code) => this.config.supportedLanguageCodes.includes(code))
      .slice(0, this.config.maxLanguages)
      .filter((code, index, array) => array.indexOf(code) === index); // Remove duplicates
  }

  /**
   * Get language details for the given codes
   */
  private getLanguageDetails(
    codes: string[]
  ): Array<{ code: string; name: string; nativeName: string }> {
    const languageMap: Record<string, { name: string; nativeName: string }> = {
      en: { name: 'English', nativeName: 'English' },
      es: { name: 'Spanish', nativeName: 'Español' },
      fr: { name: 'French', nativeName: 'Français' },
      de: { name: 'German', nativeName: 'Deutsch' },
      it: { name: 'Italian', nativeName: 'Italiano' },
      pt: { name: 'Portuguese', nativeName: 'Português' },
      zh: { name: 'Chinese', nativeName: '中文' },
      'zh-CN': { name: 'Chinese (Simplified)', nativeName: '简体中文' },
      'zh-TW': { name: 'Chinese (Traditional)', nativeName: '繁體中文' },
      ja: { name: 'Japanese', nativeName: '日本語' },
      ko: { name: 'Korean', nativeName: '한국어' },
      ar: { name: 'Arabic', nativeName: 'العربية' },
      hi: { name: 'Hindi', nativeName: 'हिन्दी' },
      ru: { name: 'Russian', nativeName: 'Русский' },
      nl: { name: 'Dutch', nativeName: 'Nederlands' },
      sv: { name: 'Swedish', nativeName: 'Svenska' },
      da: { name: 'Danish', nativeName: 'Dansk' },
      no: { name: 'Norwegian', nativeName: 'Norsk' },
      fi: { name: 'Finnish', nativeName: 'Suomi' },
      pl: { name: 'Polish', nativeName: 'Polski' },
      tr: { name: 'Turkish', nativeName: 'Türkçe' },
      he: { name: 'Hebrew', nativeName: 'עברית' },
      th: { name: 'Thai', nativeName: 'ไทย' },
      vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt' },
      id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
      ms: { name: 'Malay', nativeName: 'Bahasa Melayu' },
      tl: { name: 'Filipino', nativeName: 'Filipino' },
      uk: { name: 'Ukrainian', nativeName: 'Українська' },
      cs: { name: 'Czech', nativeName: 'Čeština' },
      hu: { name: 'Hungarian', nativeName: 'Magyar' },
      ro: { name: 'Romanian', nativeName: 'Română' },
      bg: { name: 'Bulgarian', nativeName: 'Български' },
      hr: { name: 'Croatian', nativeName: 'Hrvatski' },
      sk: { name: 'Slovak', nativeName: 'Slovenčina' },
      sl: { name: 'Slovenian', nativeName: 'Slovenščina' },
      et: { name: 'Estonian', nativeName: 'Eesti' },
      lv: { name: 'Latvian', nativeName: 'Latviešu' },
      lt: { name: 'Lithuanian', nativeName: 'Lietuvių' },
      el: { name: 'Greek', nativeName: 'Ελληνικά' },
      is: { name: 'Icelandic', nativeName: 'Íslenska' },
      mt: { name: 'Maltese', nativeName: 'Malti' },
      cy: { name: 'Welsh', nativeName: 'Cymraeg' },
      ga: { name: 'Irish', nativeName: 'Gaeilge' },
      eu: { name: 'Basque', nativeName: 'Euskera' },
      ca: { name: 'Catalan', nativeName: 'Català' },
      gl: { name: 'Galician', nativeName: 'Galego' },
      'pt-BR': {
        name: 'Portuguese (Brazil)',
        nativeName: 'Português (Brasil)',
      },
      'pt-PT': {
        name: 'Portuguese (Portugal)',
        nativeName: 'Português (Portugal)',
      },
      'en-US': { name: 'English (US)', nativeName: 'English (US)' },
      'en-GB': { name: 'English (UK)', nativeName: 'English (UK)' },
      'en-AU': {
        name: 'English (Australia)',
        nativeName: 'English (Australia)',
      },
      'en-CA': { name: 'English (Canada)', nativeName: 'English (Canada)' },
      'fr-CA': { name: 'French (Canada)', nativeName: 'Français (Canada)' },
      'es-ES': { name: 'Spanish (Spain)', nativeName: 'Español (España)' },
      'es-MX': { name: 'Spanish (Mexico)', nativeName: 'Español (México)' },
      'es-AR': {
        name: 'Spanish (Argentina)',
        nativeName: 'Español (Argentina)',
      },
      'de-DE': {
        name: 'German (Germany)',
        nativeName: 'Deutsch (Deutschland)',
      },
      'de-AT': { name: 'German (Austria)', nativeName: 'Deutsch (Österreich)' },
      'de-CH': {
        name: 'German (Switzerland)',
        nativeName: 'Deutsch (Schweiz)',
      },
      'it-IT': { name: 'Italian (Italy)', nativeName: 'Italiano (Italia)' },
      'it-CH': {
        name: 'Italian (Switzerland)',
        nativeName: 'Italiano (Svizzera)',
      },
      'nl-NL': {
        name: 'Dutch (Netherlands)',
        nativeName: 'Nederlands (Nederland)',
      },
      'nl-BE': { name: 'Dutch (Belgium)', nativeName: 'Nederlands (België)' },
      'sv-SE': { name: 'Swedish (Sweden)', nativeName: 'Svenska (Sverige)' },
      'da-DK': { name: 'Danish (Denmark)', nativeName: 'Dansk (Danmark)' },
      'no-NO': { name: 'Norwegian (Norway)', nativeName: 'Norsk (Norge)' },
      'fi-FI': { name: 'Finnish (Finland)', nativeName: 'Suomi (Suomi)' },
      'pl-PL': { name: 'Polish (Poland)', nativeName: 'Polski (Polska)' },
      'tr-TR': { name: 'Turkish (Turkey)', nativeName: 'Türkçe (Türkiye)' },
      'ru-RU': { name: 'Russian (Russia)', nativeName: 'Русский (Россия)' },
      'ja-JP': { name: 'Japanese (Japan)', nativeName: '日本語 (日本)' },
      'ko-KR': {
        name: 'Korean (South Korea)',
        nativeName: '한국어 (대한민국)',
      },
      'zh-HK': { name: 'Chinese (Hong Kong)', nativeName: '繁體中文 (香港)' },
      'zh-SG': { name: 'Chinese (Singapore)', nativeName: '简体中文 (新加坡)' },
      'ar-SA': {
        name: 'Arabic (Saudi Arabia)',
        nativeName: 'العربية (السعودية)',
      },
      'ar-EG': { name: 'Arabic (Egypt)', nativeName: 'العربية (مصر)' },
      'ar-AE': { name: 'Arabic (UAE)', nativeName: 'العربية (الإمارات)' },
      'hi-IN': { name: 'Hindi (India)', nativeName: 'हिन्दी (भारत)' },
      'th-TH': { name: 'Thai (Thailand)', nativeName: 'ไทย (ประเทศไทย)' },
      'vi-VN': {
        name: 'Vietnamese (Vietnam)',
        nativeName: 'Tiếng Việt (Việt Nam)',
      },
      'id-ID': {
        name: 'Indonesian (Indonesia)',
        nativeName: 'Bahasa Indonesia (Indonesia)',
      },
      'ms-MY': {
        name: 'Malay (Malaysia)',
        nativeName: 'Bahasa Melayu (Malaysia)',
      },
      'tl-PH': {
        name: 'Filipino (Philippines)',
        nativeName: 'Filipino (Pilipinas)',
      },
      'uk-UA': {
        name: 'Ukrainian (Ukraine)',
        nativeName: 'Українська (Україна)',
      },
      'he-IL': { name: 'Hebrew (Israel)', nativeName: 'עברית (ישראל)' },
      'is-IS': { name: 'Icelandic (Iceland)', nativeName: 'Íslenska (Ísland)' },
      'mt-MT': { name: 'Maltese (Malta)', nativeName: 'Malti (Malta)' },
      'cy-GB': { name: 'Welsh (UK)', nativeName: 'Cymraeg (DU)' },
      'ga-IE': { name: 'Irish (Ireland)', nativeName: 'Gaeilge (Éire)' },
      'eu-ES': { name: 'Basque (Spain)', nativeName: 'Euskera (Espainia)' },
      'ca-ES': { name: 'Catalan (Spain)', nativeName: 'Català (Espanya)' },
      'gl-ES': { name: 'Galician (Spain)', nativeName: 'Galego (España)' },
    };

    return codes.map((code) => {
      const langInfo = languageMap[code];
      if (langInfo) {
        return {
          code,
          name: langInfo.name,
          nativeName: langInfo.nativeName,
        };
      }
      return {
        code,
        name: code.toUpperCase(),
        nativeName: code.toUpperCase(),
      };
    });
  }

  /**
   * Get fallback analysis when detection fails
   */
  private getFallbackAnalysis(errorMessage: string): MultiLanguageAnalysis {
    return {
      isMultiLanguageRequested: false,
      requestedLanguages: ['en'],
      confidence: 0,
      reasoning: `Error calling LLM API: ${errorMessage}`,
      languageDetails: [{ code: 'en', name: 'English', nativeName: 'English' }],
    };
  }
}
