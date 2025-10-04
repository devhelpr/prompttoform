# PromptToForm.ai

**Transform plain language into dynamic, multi-step forms with AI-powered precision.**

PromptToForm.ai is an open-source platform that bridges the gap between idea and implementation, allowing teams to rapidly prototype, test, and deploy sophisticated forms through natural language descriptions.

[![Try PromptToForm.ai](https://img.shields.io/badge/Try%20Live-Demo-blue?style=for-the-badge&logo=react)](https://app.prompttoform.ai)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-❤️-red?style=for-the-badge&logo=github)](https://github.com/sponsors/devhelpr)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Ask DeepWiki](https://img.shields.io/badge/DeepWiki-Project_Documentation-blue?style=for-the-badge)](https://deepwiki.com/devhelpr/prompttoform)

---

## 🚀 **Try It Now**

**[https://app.prompttoform.ai](https://app.prompttoform.ai)**

Simply describe your form in plain English and watch it come to life with live previews, conditional logic, and multi-language support.

---

## ✨ **Key Features**

### 🎯 **AI-Powered Form Generation**
- **Natural Language Processing**: Describe your form in plain English
- **Multi-LLM Support**: OpenAI GPT-4, Anthropic Claude, Mistral, Google Gemini
- **Intelligent Field Detection**: Automatically determines appropriate input types
- **Conditional Logic**: Complex branching and validation rules from simple prompts

### 🎨 **Visual Form Builder**
- **Interactive Flow Editor**: Drag-and-drop form structure visualization
- **Real-time Preview**: See changes instantly as you build
- **Mermaid Diagrams**: Visual representation of form logic flow
- **Responsive Design**: Forms work perfectly on all devices

### 🌍 **Enterprise-Ready Features**
- **Multi-language Support**: Built-in internationalization with translation management
- **PDF Form Import**: Upload existing PDF forms and convert them to interactive forms
- **Expression Engine**: Dynamic calculations and conditional field behavior
- **Advanced Validation**: WCAG-compliant error messages and accessibility features

### 🔧 **Developer Experience**
- **React Forms Library**: Production-ready `@devhelpr/react-forms` component library
- **TypeScript Support**: Full type safety and IntelliSense
- **JSON Schema Export**: Generate OpenAPI schemas for your forms
- **Session Management**: Persistent form editing with IndexedDB storage
- **Netlify Integration**: One-click deployment to Netlify

### 📊 **Advanced Form Types**
- **Multi-step Wizards**: Complex decision trees with conditional navigation
- **Array Fields**: Dynamic lists with add/remove functionality
- **Slider Controls**: Range selectors with real-time calculations
- **Confirmation Pages**: Review and summary pages with template variables
- **Thank You Pages**: Customizable post-submission experiences

---

## 🎯 **Perfect For**

- **Product Teams**: Rapidly prototype user onboarding flows
- **Analysts**: Convert requirements into interactive forms
- **Developers**: Generate production-ready form components
- **Designers**: Create complex user journeys without coding
- **Business Users**: Build forms without technical knowledge

---

## 🚀 **Quick Start**

### **Option 1: Use the Web App**
1. Visit [https://app.prompttoform.ai](https://app.prompttoform.ai)
2. Describe your form: *"Create a 3-step job application form with conditional questions"*
3. Watch it generate instantly with live preview
4. Export as React components or deploy directly

### **Option 2: Run Locally**

```bash
# Clone the repository
git clone https://github.com/devhelpr/prompttoform
cd prompttoform

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:4200
```

### **Option 3: Use the React Library**

```bash
# Install the form renderer library
npm install @devhelpr/react-forms

# Use in your React app
import { FormRenderer } from '@devhelpr/react-forms';

<FormRenderer formJson={formDefinition} />
```

---

## 💡 **Example Prompts**

### **Simple Forms**
```
Create a contact form with name, email, and message fields
```

### **Complex Multi-step Forms**
```
Build a health insurance application with 4 steps:
1. Personal information
2. Medical history with conditional questions
3. Coverage selection based on previous answers
4. Review and confirmation page
```

### **Business Applications**
```
Create a job application form that:
- Collects basic info first
- Shows different questions based on experience level
- Includes a skills assessment for technical roles
- Has a thank you page with next steps
```

### **E-commerce Forms**
```
Build a product configuration form with:
- Product selection
- Customization options with price calculations
- Shipping information
- Payment method selection
```

---

## 🏗️ **Architecture**

### **Monorepo Structure**
- **`apps/prompttoform`**: Main web application
- **`libs/react-forms`**: Production-ready React form library
- **`playwright-tests`**: Comprehensive end-to-end testing

### **Core Technologies**
- **Frontend**: React 19, TypeScript, Tailwind CSS v4
- **Build System**: Nx monorepo, Vite
- **AI Integration**: LangChain, multiple LLM providers
- **Testing**: Playwright, Vitest
- **Deployment**: Netlify integration

### **Form Schema**
Forms follow a structured JSON schema that supports:
- Multi-page navigation with conditional logic
- Rich field types (text, email, select, slider, arrays)
- Validation rules with custom error messages
- Template variables for dynamic content
- Expression-based calculations
- Multi-language translations

---

## 🌟 **Recent Achievements**

### **✅ Production-Ready Features**
- **Multi-language Support**: Complete i18n implementation with translation management
- **PDF Import**: Upload existing PDF forms and convert to interactive forms
- **Expression Engine**: Real-time calculations and dynamic field behavior
- **Advanced Validation**: WCAG-compliant accessibility features
- **Session Management**: Persistent editing with conflict resolution

### **✅ Developer Experience**
- **TypeScript**: Full type safety across the entire codebase
- **Testing**: Comprehensive Playwright test suite
- **Documentation**: Detailed API documentation and examples
- **Performance**: Optimized rendering with React.memo and lazy loading

### **✅ Enterprise Features**
- **Netlify Integration**: One-click deployment
- **Schema Export**: Json-schema generation for validation
- **Custom Styling**: Complete theme customization support

---

## 🤝 **Contributing**

We welcome contributions! Here's how you can help:

### **For Developers**
- **Bug Reports**: Found an issue? [Open an issue](https://github.com/devhelpr/prompttoform/issues)
- **Feature Requests**: Have an idea? [Start a discussion](https://github.com/devhelpr/prompttoform/discussions)
- **Code Contributions**: [Fork and submit a PR](https://github.com/devhelpr/prompttoform/pulls)

### **For Non-Developers**
- **Documentation**: Help improve our guides and examples
- **Testing**: Try the tool and report bugs or usability issues
- **Feedback**: Share your use cases and feature ideas

### **Development Setup**
```bash
# Install dependencies
npm install

# Run tests
npm run test

# Run Playwright tests
npm run test-playwright

# Build the library
npm run build-react-forms
```

---

## 💖 **Support the Project**

PromptToForm.ai is built with ❤️ and maintained by a one man team. Your support helps me:

- **Maintain Infrastructure**: Keep the web app running smoothly
- **Add New Features**: Implement community-requested functionality
- **Improve Performance**: Optimize for better user experience
- **Expand AI Capabilities**: Integrate with more LLM providers

### **Ways to Support**

- **⭐ Star the Repository**: Help others discover the project
- **🐛 Report Issues**: Help us improve by reporting bugs
- **💡 Suggest Features**: Share your ideas for new functionality
- **💰 GitHub Sponsors**: [Become a sponsor](https://github.com/sponsors/devhelpr) to support ongoing development
- **📢 Spread the Word**: Share with your network and communities

---

## 🔗 **Contact**

[maikel@devhelpr.com](mailto:maikel@devhelpr.com)

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **OpenAI, Anthropic, Mistral, Google**: For providing powerful AI models
- **React Team**: For the amazing React ecosystem
- **Nx Team**: For the excellent monorepo tooling
- **Community**: For feedback, contributions, and support

---

**Made with ❤️, TypeScript, and a passion for making form creation accessible to everyone.**

*Transform your ideas into interactive forms in seconds, not hours.*