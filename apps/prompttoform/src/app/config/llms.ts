import { APIConfig } from '../interfaces/api-config';

export const llmAPIs: APIConfig[] = [
  {
    name: 'OpenAI-system',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-5-mini',
    description: "OpenAI's gpt-5-mini model via prompttoform.ai",
    isChatCompletionCompatible: true,
    systemKey: 'openai',
    supportsTemperature: false,
    additionalProperties: {
      reasoning_effort: 'minimal',
    },
  },
  {
    name: 'OpenAI-system-v5-nano',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-5-nano',
    description: "OpenAI's gpt-5-nano model via prompttoform.ai",
    isChatCompletionCompatible: true,
    systemKey: 'openai',
    supportsTemperature: false,
    additionalProperties: {
      reasoning_effort: 'minimal',
    },
  },
  {
    name: 'OpenAI-system-v5',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-5',
    description: "OpenAI's gpt-5 model via prompttoform.ai",
    isChatCompletionCompatible: true,
    systemKey: 'openai',
    supportsTemperature: false,
  },
  {
    name: 'OpenAI-system-v4.1',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4.1',
    description: "OpenAI's gpt-4.1 model via prompttoform.ai",
    isChatCompletionCompatible: true,
    systemKey: 'openai',
    supportsTemperature: true,
  },
  {
    name: 'Gemini-2.5-experimental-system',
    baseUrl:
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=',
    apiKey: '',
    model: 'ggemini-2.0-flash',
    description: "Google's gemini-2.0-flash model via prompttoform.ai",
    isChatCompletionCompatible: false,
    systemKey: 'gemini',
    supportsTemperature: true,
  },
  {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4.1',
    description: "OpenAI's gpt-4.1 model (provide your own API key)",
    isChatCompletionCompatible: true,
    supportsTemperature: true,
  },
  {
    name: 'Anthropic Claude Haiku 4.5',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: '',
    model: 'claude-haiku-4-5',
    description:
      "Anthropic's claude-haiku-4-5 model (provide your own API key)",
    isChatCompletionCompatible: true,
    supportsTemperature: true,
  },
  {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: '',
    model: 'claude-3-7-sonnet-20250219',
    description:
      "Anthropic's claude-3-7-sonnet-20250219 model (provide your own API key)",
    isChatCompletionCompatible: true,
    supportsTemperature: true,
  },
  {
    name: 'Anthropic claude 4',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: '',
    model: 'claude-sonnet-4-20250514',
    description:
      "Anthropic's claude-sonnet-4-20250514 model (provide your own API key)",
    isChatCompletionCompatible: true,
    supportsTemperature: true,
  },
  {
    name: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    apiKey: '',
    model: 'mistral-large-latest',
    description:
      "Mistral's mistral-large-latest model (provide your own API key)",
    isChatCompletionCompatible: true,
    supportsTemperature: true,
  },
  {
    name: 'Gemini',
    baseUrl:
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=',
    apiKey: '',
    model: 'gemini-2.0-flash',
    description: "Google's gemini-2.0-flash model (provide your own API key)",
    isChatCompletionCompatible: false,
    supportsTemperature: true,
  },
  ///
  // {
  //   name: "Ollama",
  //   baseUrl: "http://localhost:11434/v1",
  //   apiKey: "",
  //   model: "llama3.2:latest",
  //   description: "llama3.2:latest",
  //   isChatCompletionCompatible: true,
  // },
  // {
  //   name: "Gemini-2.5-experimental",
  //   baseUrl:
  //     "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent?key=",
  //   apiKey: "",
  //   model: "gemini-2.5-pro-exp-03-25",
  //   description:
  //     "Google's gemini-2.5-experimental model (provide your own API key)",
  //   isChatCompletionCompatible: false,
  // },
];
