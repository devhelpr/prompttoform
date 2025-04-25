import { FormSchema, Page, Component, Action } from "./types";

export class FormGenerator {
  private schema: FormSchema;
  private container: HTMLElement;
  private currentPage: Page | null = null;
  private formData: Record<string, unknown> = {};
  private pageHistory: string[] = [];
  private touchedFields: Set<string> = new Set();

  constructor(schema: FormSchema, containerId: string) {
    this.schema = schema;
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = container;
  }

  public init(): void {
    this.renderTitle();
    this.navigateToPage(this.schema.app.pages[0].id);
  }

  private renderTitle(): void {
    const title = document.createElement("h1");
    title.textContent = this.schema.app.title;
    this.container.appendChild(title);
  }

  private navigateToPage(pageId: string): void {
    const page = this.schema.app.pages.find((p) => p.id === pageId);
    if (!page) {
      throw new Error(`Page with id "${pageId}" not found`);
    }

    this.currentPage = page;
    this.pageHistory.push(pageId);
    this.container.innerHTML = "";
    this.renderTitle();
    this.renderPage(page);
  }

  private goBack(): void {
    if (this.pageHistory.length > 1) {
      this.pageHistory.pop(); // Remove current page
      const previousPageId = this.pageHistory.pop(); // Get previous page
      if (previousPageId) {
        this.navigateToPage(previousPageId);
      }
    }
  }

  private renderPage(page: Page): void {
    const pageContainer = document.createElement("div");
    pageContainer.className = `page ${page.layout || "vertical"}`;

    const pageTitle = document.createElement("h2");
    pageTitle.textContent = page.title;
    pageContainer.appendChild(pageTitle);

    // Add back button if not on first page
    if (this.pageHistory.length > 1) {
      const backButton = document.createElement("button");
      backButton.textContent = "Back";
      backButton.className = "back-button";
      backButton.addEventListener("click", () => this.goBack());
      pageContainer.appendChild(backButton);
    }

    const form = document.createElement("form");
    form.addEventListener("submit", (e) => e.preventDefault());

    page.components.forEach((component) => {
      const componentElement = this.renderComponent(component);
      if (this.isComponentVisible(component)) {
        form.appendChild(componentElement);
      }
    });

    pageContainer.appendChild(form);
    this.container.appendChild(pageContainer);
  }

  private isComponentVisible(component: Component): boolean {
    if (
      !component.visibilityConditions ||
      component.visibilityConditions.length === 0
    ) {
      return true;
    }

    return component.visibilityConditions.every((condition) => {
      const fieldValue = this.formData[condition.field];
      if (fieldValue === undefined) return false;

      switch (condition.operator) {
        case "==":
          return fieldValue === condition.value;
        case "!=":
          return fieldValue !== condition.value;
        case ">":
          return Number(fieldValue) > Number(condition.value);
        case "<":
          return Number(fieldValue) < Number(condition.value);
        case ">=":
          return Number(fieldValue) >= Number(condition.value);
        case "<=":
          return Number(fieldValue) <= Number(condition.value);
        default:
          return true;
      }
    });
  }

  private renderComponent(component: Component): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = `component ${component.type}`;
    wrapper.id = `component-${component.id}`;

    if (component.label) {
      const label = document.createElement("label");
      label.textContent = component.label;
      if (component.validation?.required) {
        const requiredMarker = document.createElement("span");
        requiredMarker.textContent = " *";
        requiredMarker.className = "required-marker";
        requiredMarker.style.color = "red";
        label.appendChild(requiredMarker);
      }
      wrapper.appendChild(label);
    }

    let element: HTMLElement;
    switch (component.type) {
      case "input":
        element = this.createInput(component);
        break;
      case "textarea":
        element = this.createTextarea(component);
        break;
      case "select":
        element = this.createSelect(component);
        break;
      case "button":
        element = this.createButton(component);
        break;
      case "text":
        element = this.createText(component);
        break;
      case "radio":
        element = this.createRadioGroup(component);
        break;
      case "checkbox":
        element = this.createCheckbox(component);
        break;
      default:
        element = document.createElement("div");
        element.textContent = `Unsupported component type: ${component.type}`;
    }

    wrapper.appendChild(element);
    this.setupValidation(component, element);
    this.setupEventHandlers(component, element);

    return wrapper;
  }

  private createInput(component: Component): HTMLInputElement {
    const input = document.createElement("input");
    input.type = component.props?.type || "text";
    input.id = component.id;
    input.name = component.id;

    if (component.props) {
      Object.entries(component.props).forEach(([key, value]) => {
        input.setAttribute(key, value.toString());
      });
    }

    // Add change listener to update formData
    input.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      this.formData[component.id] = target.value;
      this.updateVisibility();
    });

    return input;
  }

  private createTextarea(component: Component): HTMLTextAreaElement {
    const textarea = document.createElement("textarea");
    textarea.id = component.id;
    textarea.name = component.id;

    if (component.props) {
      Object.entries(component.props).forEach(([key, value]) => {
        textarea.setAttribute(key, value.toString());
      });
    }

    // Add change listener to update formData
    textarea.addEventListener("change", (e) => {
      const target = e.target as HTMLTextAreaElement;
      this.formData[component.id] = target.value;
      this.updateVisibility();
    });

    return textarea;
  }

  private createSelect(component: Component): HTMLSelectElement {
    const select = document.createElement("select");
    select.id = component.id;
    select.name = component.id;

    if (component.props?.options) {
      component.props.options.forEach(
        (option: { value: string; label: string }) => {
          const optionElement = document.createElement("option");
          optionElement.value = option.value;
          optionElement.textContent = option.label;
          select.appendChild(optionElement);
        }
      );
    }

    // Add change listener to update formData
    select.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      this.formData[component.id] = target.value;
      this.updateVisibility();
    });

    return select;
  }

  private createButton(component: Component): HTMLButtonElement {
    const button = document.createElement("button");
    button.id = component.id;
    button.textContent = component.label || "";
    button.type = component.props?.type || "button";

    return button;
  }

  private createText(component: Component): HTMLParagraphElement {
    const text = document.createElement("p");
    text.id = component.id;
    text.textContent = component.props?.text || "";
    return text;
  }

  private createRadioGroup(component: Component): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "radio-group";

    if (component.props?.options) {
      component.props.options.forEach(
        (option: { value: string; label: string }) => {
          const wrapper = document.createElement("div");
          wrapper.className = "radio-option";

          const input = document.createElement("input");
          input.type = "radio";
          input.id = `${component.id}-${option.value}`;
          input.name = component.id;
          input.value = option.value;

          // Set initial value if it exists in formData
          if (this.formData[component.id] === option.value) {
            input.checked = true;
          }

          const label = document.createElement("label");
          label.htmlFor = input.id;
          label.textContent = option.label;

          // Add change listener to update formData
          input.addEventListener("change", (e) => {
            const target = e.target as HTMLInputElement;
            if (target.checked) {
              this.formData[component.id] = target.value;
              this.updateVisibility();
            }
          });

          wrapper.appendChild(input);
          wrapper.appendChild(label);
          container.appendChild(wrapper);
        }
      );
    }

    return container;
  }

  private createCheckbox(component: Component): HTMLDivElement {
    const wrapper = document.createElement("div");
    wrapper.className = "checkbox-wrapper";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = component.id;
    input.name = component.id;

    // Set initial value if it exists in formData
    if (this.formData[component.id] !== undefined) {
      input.checked = Boolean(this.formData[component.id]);
    }

    const label = document.createElement("label");
    label.htmlFor = component.id;
    label.textContent = component.label || "";

    // Add change listener to update formData
    input.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      this.formData[component.id] = target.checked;
      this.updateVisibility();
    });

    wrapper.appendChild(input);
    wrapper.appendChild(label);
    return wrapper;
  }

  private updateVisibility(): void {
    const page = this.currentPage;
    if (!page) return;

    const form = this.container.querySelector("form");
    if (!form) return;

    // Remove all components
    while (form.firstChild) {
      form.removeChild(form.firstChild);
    }

    // Re-render components with updated visibility
    page.components.forEach((component) => {
      const componentElement = this.renderComponent(component);
      if (this.isComponentVisible(component)) {
        form.appendChild(componentElement);
      }
    });
  }

  private setupValidation(component: Component, element: HTMLElement): void {
    if (!component.validation) return;

    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    ) {
      // Add blur event to track touched state
      element.addEventListener("blur", () => {
        this.touchedFields.add(element.name);
        this.validateField(element);
      });

      if (component.validation.required) {
        element.required = true;
      }
      if (component.validation.minLength) {
        element.minLength = component.validation.minLength;
      }
      if (component.validation.maxLength) {
        element.maxLength = component.validation.maxLength;
      }
      if (component.validation.pattern && element instanceof HTMLInputElement) {
        element.pattern = component.validation.pattern;
      }
    }
  }

  private validateField(
    element:
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
      | HTMLElement,
    force: boolean = false
  ): boolean {
    if (!force && !this.touchedFields.has(element.getAttribute("name") || "")) {
      return true;
    }

    let isValid = true;

    // Handle input elements
    if (element instanceof HTMLInputElement) {
      if (element.type === "button") return true;

      if (element.required && !element.value) {
        isValid = false;
        this.showValidationError(element, "This field is required");
      } else {
        this.clearValidationError(element);
      }

      if (element.pattern) {
        const regex = new RegExp(element.pattern);
        if (!regex.test(element.value)) {
          isValid = false;
          this.showValidationError(element, "Invalid format");
        }
      }

      if (element.minLength && element.value.length < element.minLength) {
        isValid = false;
        this.showValidationError(
          element,
          `Minimum length is ${element.minLength}`
        );
      }
      if (element.maxLength && element.value.length > element.maxLength) {
        isValid = false;
        this.showValidationError(
          element,
          `Maximum length is ${element.maxLength}`
        );
      }
    }
    // Handle textarea elements
    else if (element instanceof HTMLTextAreaElement) {
      if (element.required && !element.value) {
        isValid = false;
        this.showValidationError(element, "This field is required");
      } else {
        this.clearValidationError(element);
      }

      if (element.minLength && element.value.length < element.minLength) {
        isValid = false;
        this.showValidationError(
          element,
          `Minimum length is ${element.minLength}`
        );
      }
      if (element.maxLength && element.value.length > element.maxLength) {
        isValid = false;
        this.showValidationError(
          element,
          `Maximum length is ${element.maxLength}`
        );
      }
    }
    // Handle select elements
    else if (element instanceof HTMLSelectElement) {
      if (element.required && !element.value) {
        isValid = false;
        this.showValidationError(element, "This field is required");
      } else {
        this.clearValidationError(element);
      }
    }

    return isValid;
  }

  private validateForm(): boolean {
    const form = this.container.querySelector("form");
    if (!form) return true;

    let isValid = true;
    const invalidFields: string[] = [];

    // Mark all fields as touched when validating the form
    form.querySelectorAll("input, select, textarea").forEach((element) => {
      const input = element as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement;
      this.touchedFields.add(input.name);
    });

    // Check all form elements
    form.querySelectorAll("input, select, textarea").forEach((element) => {
      const input = element as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement;
      if (!this.validateField(input, true)) {
        isValid = false;
        invalidFields.push(input.name);
      }
    });

    // Check radio groups
    form.querySelectorAll(".radio-group").forEach((group) => {
      const radioInputs = group.querySelectorAll('input[type="radio"]');
      const name = (radioInputs[0] as HTMLInputElement).name;
      const isRequired = (radioInputs[0] as HTMLInputElement).required;
      const hasChecked = Array.from(radioInputs).some(
        (input) => (input as HTMLInputElement).checked
      );

      if (isRequired && !hasChecked) {
        isValid = false;
        invalidFields.push(name);
        this.showValidationError(
          group as HTMLElement,
          "Please select an option"
        );
      } else {
        this.clearValidationError(group as HTMLElement);
      }
    });

    // Check checkboxes
    form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      const input = checkbox as HTMLInputElement;
      if (!this.validateField(input, true)) {
        isValid = false;
        invalidFields.push(input.name);
      }
    });

    return isValid;
  }

  private showValidationError(element: HTMLElement, message: string): void {
    const errorElement = document.createElement("div");
    errorElement.className = "validation-error";
    errorElement.textContent = message;
    element.parentElement?.appendChild(errorElement);
    element.classList.add("invalid");
  }

  private clearValidationError(element: HTMLElement): void {
    const existingError =
      element.parentElement?.querySelector(".validation-error");
    if (existingError) {
      existingError.remove();
    }
    element.classList.remove("invalid");
  }

  private setupEventHandlers(component: Component, element: HTMLElement): void {
    if (!component.eventHandlers) return;

    if (component.eventHandlers.onChange) {
      element.addEventListener("change", () =>
        this.handleEvent(component.eventHandlers!.onChange!)
      );
    }

    if (component.eventHandlers.onClick) {
      element.addEventListener("click", () =>
        this.handleEvent(component.eventHandlers!.onClick!)
      );
    }
  }

  private async handleEvent(action: Action): Promise<void> {
    switch (action.type) {
      case "navigate":
        if (action.targetPage) {
          // Validate form before navigation
          if (this.validateForm()) {
            this.navigateToPage(action.targetPage);
          }
        }
        break;
      case "submit":
        if (this.validateForm()) {
          this.handleSubmit(action);
        }
        break;
      case "apiRequest":
        await this.handleApiRequest(action);
        break;
      case "showMessage":
        if (action.message) {
          alert(action.message);
        }
        break;
    }
  }

  private handleSubmit(action: Action): void {
    const form = this.container.querySelector("form") as HTMLFormElement;
    if (!form) return;

    const formDataObj: Record<string, unknown> = {};

    // Handle radio buttons and checkboxes
    form.querySelectorAll('input[type="radio"]:checked').forEach((input) => {
      const radio = input as HTMLInputElement;
      formDataObj[radio.name] = radio.value;
    });

    form.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      const checkbox = input as HTMLInputElement;
      formDataObj[checkbox.name] = checkbox.checked;
    });

    // Handle other form elements
    form
      .querySelectorAll(
        'input:not([type="radio"]):not([type="checkbox"]), select, textarea'
      )
      .forEach((element) => {
        const input = element as
          | HTMLInputElement
          | HTMLSelectElement
          | HTMLTextAreaElement;
        formDataObj[input.name] = input.value;
      });

    this.formData = formDataObj;

    if (action.params?.url) {
      fetch(action.params.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.formData),
      });
    }
  }

  private async handleApiRequest(action: Action): Promise<void> {
    if (!action.dataSource) return;

    const dataSource = this.schema.app.dataSources?.find(
      (ds) => ds.id === action.dataSource
    );
    if (!dataSource) return;

    try {
      const response = await fetch(dataSource.url, {
        method: dataSource.method || "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body:
          dataSource.method !== "GET"
            ? JSON.stringify(action.params)
            : undefined,
      });

      const data = await response.json();
      if (dataSource.responseMapping) {
        // Implement response mapping logic
        console.log("API Response:", data);
      }
    } catch (error) {
      console.error("API request failed:", error);
    }
  }

  private clearValidationErrors(): void {
    this.touchedFields.clear();
    const errors = this.container.querySelectorAll(".validation-error");
    errors.forEach((error) => error.remove());
    const invalidElements = this.container.querySelectorAll(".invalid");
    invalidElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.classList.remove("invalid");
      }
    });
  }
}
