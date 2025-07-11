export interface APIConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  description: string;
  isChatCompletionCompatible: boolean;
  systemKey?: string;
}
