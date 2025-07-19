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
* Session management with IndexedDB storage
* Form update history tracking
* Netlify deployment integration with session linking

## TODO

- [x] fix branching logic for steps
- [x] remove "ocif" references and names...
- [x] use cloudflare worker as proxy to prevent CORS issues
- [x] add a visual schema of the generated form steps
- [x] split up FormRenderer into multiple components and library
- [x] deploy netlify and support for netlify forms
- [ ] improve ui so that it:
  - [x] store prompt and generated json in indexeddb
- [x] store all changes (which were done using "update"-functionality) and resulting form json in indexeddb and link to the orginal prompt (via guid)
- [x] "start new session" button
  - [x] also store netlify siteid for this session
- [x] show overview of all sessions and prompts
- [x] load previous session from indexeddb
- [x] split up FormGenerator into multiple components
- [x] Make vitest component tests for FormRenderer using testing-library
  
- [x] add a "dropdown-button" for examples (including an empty example) 
- [x] change the layout so that when the application or session starts that there's only a textarea in the middle of the screen. The application will also have a top menu bar (which should be reponsive) with on the right the menu options for settings and show history. On mobile (smaller viewport) a hambuerger menu should be shown with these options.
- [x] after entering the promt to create a form, the layout of the application should change to show the form preview, the visiual flow the form json. On the left side of the screen should be a sidebar which contains the entered prompt in read-only mode and a new textarea to update the form. There also should be a button to "deploy to netlify" and a button to "evaluate and rerun".

- [ ] change the flow and visual-flow tabs and replace with a single tab "visual flow" that uses FormFlowMermaid component
- [ ] when the sidebar is open, a "update form" textarea is shown but it has no "update" button.
- [ ] also show the history of the creation process in the sidebar.
- [ ] remove the icons in the tabs

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