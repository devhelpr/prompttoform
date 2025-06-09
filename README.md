# PromptToForm.ai

**PromptToForm.ai** is an open-source prompt-to-form generator that transforms plain language instructions into structured JSON-based multi-step forms — with live previews. Built for analysts, product teams, and developers who want to rapidly design, test, and hand off dynamic forms.

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/devhelpr/prompttoform)

---

## Features

* Prompt-to-JSON form generation
* Multi-step form rendering
* Core input types (text, email, select, etc.)
* Conditional logic via prompt
* Live preview as you prompt
* Exportable JSON schema

## TODO

- [x] fix branching logic for steps
- [x] remove "ocif" references and names...
- [x] use cloudflare worker as proxy to prevent CORS issues
- [x] add a visual schema of the generated form steps
- [ ] split up FormRenderer into multiple components
- [ ] split up FormGenerator into multiple components
- [ ] Make vitest component tests for FormRenderer using testing-library

## Why?

Forms are painful to spec, slow to build, and hard to get right — especially when technical and non-technical teams need to collaborate. PromptToForm bridges that gap with AI-driven simplicity.

---

## Getting Started

```bash
git clone https://github.com/devhelpr/prompttoform
cd prompttoform
npm install
npm run dev
```

Run the worker locally via separate repo: https://github.com/devhelpr/form-generator-worker

---

## License

This project is licensed under the MIT License. Feel free to use it, fork it, and contribute.

## Contributing

PRs are welcome! Issues, discussions, and feedback are even more welcome.

---

## Hire Me (Sweden-based Developers, Read This!)

Hey! I'm currently working as a freelance full-stack developer in the Netherlands, and I'm relocating to **Sweden** within the next half year (november 2025 and onwards). I'm actively looking for a **permanent full-stack developer role** — React, TypeScript, Node.js, .Net C#, Python and anything AI-powered or infinite-canvas related is my sweet spot.

If you're a Swedish company working on interesting tools, platforms, or creative developer experiences, **I'd love to chat**. PromptToForm.ai is one of my open projects to showcase my thinking, problem-solving, and product-building ability.

Reach out:

* Email: [maikel@devhelpr.com](mailto:maikel@devhelpr.com)
* LinkedIn: [linkedin.com/in/devhelpr](https://linkedin.com/in/devhelpr)

---

## Made with love, TypeScript, curiosity...and a bit of Vibe coding ... just to see how far it can get



## Supported LLM APIs

The tool supports the following LLM APIs:

- OpenAI (GPT-4.1)
- Anthropic (Claude 3.7 Sonnet)
- Mistral (Mistral Large)
- Google Gemini (Gemini Pro experimental)


## Example Prompt

Here's an example prompt to test the generator:

```
imagine a simple health-check wizard asking questions and branching based on user answers.. make sure that if no doctor visit is needed that this is shown with a disclaimer

```

and another example:

```
3-step job app form
```


Here's an example of a form with an array field:

```
create a simple form with an array field-type for maintaining a list of contacts

```

```
show age field and if age < 18 show a parent consent 
```

```
make a form that is complex , has branches at least 4 layers deep... so a real decision tree.. make it about health and just make something up.. this is just for testing
```