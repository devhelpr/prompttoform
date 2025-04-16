# OCIF Generator

A simple tool to generate OCIF files using various LLM APIs that are compatible with the OpenAI API specification.

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
3. Enter your prompt describing the OCIF diagram you want to generate
4. Click "Generate OCIF" to create the diagram
5. Use the "Copy to Clipboard" or "Download" buttons to save your generated OCIF file

## Example Prompt

Here's an example prompt to test the generator:

```
Create a diagram with 6 nodes (a,b,c,d,e,f)... where node a,b,c are connected from a to b to c. node d and e are connected to node f. node f is connected to node a.
node d should be an oval.
node a should be blue and node f should be red.
node b should be yellow and node c should be green.
node e should be orange.

make it beautiful and have the nodes have darker strokes then the fill color

put nodes d,e,f in a group
```

```
create a flow that illustrates an llm prompt evaluating pipeline
```

```
create a complex flow that illustrates an llm prompt evaluating pipeline with a feedback loop that runs max 5 times
```

## Features

- Support for multiple LLM APIs (OpenAI, Anthropic, Mistral, Google Gemini)
- Automatic layout generation using d3-force
- Schema validation
- Copy to clipboard and download functionality
- Settings panel for API configuration
- Beautiful and modern UI with Tailwind CSS

## Learn More

- [OCIF Specification](https://canvasprotocol.org/spec)
- [Canvas Protocol Homepage](https://canvasprotocol.org)
- [Example OCIF File](/hello-world.ocif.json)

