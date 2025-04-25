import { FormSchema, Page, Component, Action, DataSource } from "./types";

export class FormGenerator {
  private schema: FormSchema;
  private container: HTMLElement;
  private currentPage: Page | null = null;
  private formData: Record<string, unknown> = {};

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
    this.container.innerHTML = "";
    this.renderTitle();
    this.renderPage(page);
  }

  private renderPage(page: Page): void {
    const pageContainer = document.createElement("div");
    pageContainer.className = `page ${page.layout || "vertical"}`;

    const pageTitle = document.createElement("h2");
    pageTitle.textContent = page.title;
    pageContainer.appendChild(pageTitle);

    page.components.forEach((component) => {
      const componentElement = this.renderComponent(component);
      pageContainer.appendChild(componentElement);
    });

    this.container.appendChild(pageContainer);
  }

  private renderComponent(component: Component): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = `component ${component.type}`;
    wrapper.id = `component-${component.id}`;

    if (component.label) {
      const label = document.createElement("label");
      label.textContent = component.label;
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

  private setupValidation(component: Component, element: HTMLElement): void {
    if (!component.validation) return;

    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      if (component.validation.required) {
        element.required = true;
      }
      if (component.validation.minLength) {
        element.minLength = component.validation.minLength;
      }
      if (component.validation.maxLength) {
        element.maxLength = component.validation.maxLength;
      }
      if (component.validation.pattern) {
        element.pattern = component.validation.pattern;
      }
    }
  }

  private setupEventHandlers(component: Component, element: HTMLElement): void {
    if (!component.eventHandlers) return;

    if (component.eventHandlers.onChange) {
      element.addEventListener("change", (e) =>
        this.handleEvent(component.eventHandlers!.onChange!, e)
      );
    }

    if (component.eventHandlers.onClick) {
      element.addEventListener("click", (e) =>
        this.handleEvent(component.eventHandlers!.onClick!, e)
      );
    }
  }

  private async handleEvent(action: Action, event: Event): Promise<void> {
    switch (action.type) {
      case "navigate":
        if (action.targetPage) {
          this.navigateToPage(action.targetPage);
        }
        break;
      case "submit":
        this.handleSubmit(action);
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

    const formData = new FormData(form);
    this.formData = Object.fromEntries(formData.entries());

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
}
