import { VanillaFormCore } from "./VanillaFormCore";
import { ExtendedFormSchema } from "./VanillaFormCore";

export class VanillaFormRenderer {
  private formCore: VanillaFormCore;
  private container: HTMLElement;
  private currentStep: number = 0;
  private totalSteps: number;

  constructor(schema: ExtendedFormSchema, containerId: string) {
    this.formCore = new VanillaFormCore(schema, containerId);
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = container;
    this.totalSteps = schema.app.pages.length;
  }

  public init(): void {
    this.formCore.init();
    this.renderStepIndicator();
    this.renderNavigationControls();
    this.setupEventListeners();
  }

  private renderStepIndicator(): void {
    const indicator = document.createElement("div");
    indicator.className = "flex justify-center items-center space-x-2 mb-6";

    for (let i = 0; i < this.totalSteps; i++) {
      const step = document.createElement("div");
      step.className = `flex items-center ${
        i === this.currentStep ? "text-blue-600" : "text-gray-400"
      }`;

      // Step number
      const number = document.createElement("div");
      number.className = `w-6 h-6 rounded-full flex items-center justify-center text-sm ${
        i === this.currentStep
          ? "bg-blue-600 text-white"
          : "bg-gray-200 text-gray-600"
      }`;
      number.textContent = (i + 1).toString();
      step.appendChild(number);

      // Step connector (except for last step)
      if (i < this.totalSteps - 1) {
        const connector = document.createElement("div");
        connector.className = `w-8 h-0.5 ${
          i === this.currentStep ? "bg-blue-600" : "bg-gray-200"
        }`;
        step.appendChild(connector);
      }

      indicator.appendChild(step);
    }

    this.container.insertBefore(indicator, this.container.firstChild);
  }

  private renderNavigationControls(): void {
    const controls = document.createElement("div");
    controls.className = "flex justify-between items-center mt-6";

    const backButton = document.createElement("button");
    backButton.className = `px-4 py-2 text-sm font-medium rounded-md ${
      this.currentStep === 0
        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
    }`;
    backButton.textContent = "Back";
    backButton.disabled = this.currentStep === 0;
    backButton.addEventListener("click", () => this.handlePrevious());

    const nextButton = document.createElement("button");
    nextButton.className = `px-4 py-2 text-sm font-medium rounded-md ${
      this.currentStep === this.totalSteps - 1
        ? "bg-green-600 text-white hover:bg-green-700"
        : "bg-blue-600 text-white hover:bg-blue-700"
    }`;
    nextButton.textContent =
      this.currentStep === this.totalSteps - 1 ? "Submit" : "Next";
    nextButton.addEventListener("click", () => this.handleNext());

    controls.appendChild(backButton);
    controls.appendChild(nextButton);
    this.container.appendChild(controls);
  }

  private setupEventListeners(): void {
    // Listen for form submission events
    this.container.addEventListener("formSubmit", (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("Form submitted with data:", customEvent.detail);
    });
  }

  private handlePrevious(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.formCore.navigateToPage(
        this.formCore.schema.app.pages[this.currentStep].id
      );
      this.updateNavigationControls();
    }
  }

  private handleNext(): void {
    if (this.currentStep === this.totalSteps - 1) {
      // Handle form submission
      if (this.formCore.validateForm()) {
        this.formCore.handleFormSubmit();
      }
    } else {
      // Navigate to next page
      if (this.formCore.validateForm()) {
        this.currentStep++;
        this.formCore.navigateToPage(
          this.formCore.schema.app.pages[this.currentStep].id
        );
        this.updateNavigationControls();
      }
    }
  }

  private updateNavigationControls(): void {
    const backButton = this.container.querySelector(
      ".back-button"
    ) as HTMLButtonElement;
    const nextButton = this.container.querySelector(
      ".next-button"
    ) as HTMLButtonElement;

    if (backButton) {
      backButton.disabled = this.currentStep === 0;
      backButton.className = `px-4 py-2 text-sm font-medium rounded-md ${
        this.currentStep === 0
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
      }`;
    }

    if (nextButton) {
      nextButton.textContent =
        this.currentStep === this.totalSteps - 1 ? "Submit" : "Next";
      nextButton.className = `px-4 py-2 text-sm font-medium rounded-md ${
        this.currentStep === this.totalSteps - 1
          ? "bg-green-600 text-white hover:bg-green-700"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`;
    }

    // Update step indicator
    const steps = this.container.querySelectorAll(".step");
    steps.forEach((step, index) => {
      step.classList.toggle("text-blue-600", index === this.currentStep);
      step.classList.toggle("text-gray-400", index !== this.currentStep);
      const number = step.querySelector("div");
      if (number) {
        number.classList.toggle(
          "bg-blue-600 text-white",
          index === this.currentStep
        );
        number.classList.toggle(
          "bg-gray-200 text-gray-600",
          index !== this.currentStep
        );
      }
      const connector = step.querySelector("div:last-child");
      if (connector) {
        connector.classList.toggle("bg-blue-600", index === this.currentStep);
        connector.classList.toggle("bg-gray-200", index !== this.currentStep);
      }
    });
  }
}
