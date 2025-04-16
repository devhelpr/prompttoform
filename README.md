# OCIF Generator

A simple tool to generate Form/ui JSON files using various LLM APIs that are compatible with the OpenAI API specification.

## Supported LLM APIs

The tool supports the following LLM APIs:
- OpenAI (GPT-4)
- Anthropic (Claude 3 Opus)
- Mistral (Mistral Large)
- Google Gemini (Gemini Pro)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Configure your API keys in the settings panel of the application, or add them to your `.env` file:
```
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
VITE_MISTRAL_API_KEY=your_mistral_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

4. Start the development server:
```bash
npm run dev
```

## Usage

1. Open the application in your browser
2. Click the "Settings" button to configure your preferred LLM API and API key
3. Enter your prompt describing the Form/ui you want to generate
4. Click "Generate OCIF" to create the diagram
5. Use the "Copy to Clipboard" or "Download" buttons to save your generated JSON file

## Example Prompt

Here's an example prompt to test the generator:

```
imagine a simple health-check wizard asking questions and branching based on user answers.
```


## Features

- Support for multiple LLM APIs (OpenAI, Anthropic, Mistral, Google Gemini)
- Automatic layout generation using d3-force
- Schema validation
- Copy to clipboard and download functionality
- Settings panel for API configuration
- Beautiful and modern UI with Tailwind CSS

