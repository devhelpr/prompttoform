import { FormGenerator } from "./FormGenerator";
import { ExtendedFormSchema } from "./FormGenerator";

export class FormRenderer {
  private formGenerator: FormGenerator;
  private container: HTMLElement;
  private currentStep: number = 0;
  private totalSteps: number;

  constructor(schema: ExtendedFormSchema, containerId: string) {
    this.formGenerator = new FormGenerator(schema, containerId);
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = container;
    this.totalSteps = schema.app.pages.length;
  }

  public init(): void {
    this.formGenerator.init();
    this.renderStepIndicator();
    this.renderNavigationControls();
    this.setupEventListeners();
  }

  private renderStepIndicator(): void {
    const indicator = document.createElement("div");
    indicator.className = "step-indicator";

    for (let i = 0; i < this.totalSteps; i++) {
      const step = document.createElement("div");
      step.className = `step ${i === this.currentStep ? "active" : ""}`;
      step.textContent = (i + 1).toString();
      indicator.appendChild(step);
    }

    this.container.insertBefore(indicator, this.container.firstChild);
  }

  private renderNavigationControls(): void {
    const controls = document.createElement("div");
    controls.className = "navigation-controls";

    const backButton = document.createElement("button");
    backButton.className = "back-button";
    backButton.textContent = "Back";
    backButton.disabled = this.currentStep === 0;
    backButton.addEventListener("click", () => this.handlePrevious());

    const nextButton = document.createElement("button");
    nextButton.className = "next-button";
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
      this.formGenerator.navigateToPage(
        this.formGenerator.schema.app.pages[this.currentStep].id
      );
      this.updateNavigationControls();
    }
  }

  private handleNext(): void {
    if (this.currentStep === this.totalSteps - 1) {
      // Handle form submission
      if (this.formGenerator.validateForm()) {
        this.formGenerator.handleFormSubmit();
      }
    } else {
      // Navigate to next page
      if (this.formGenerator.validateForm()) {
        this.currentStep++;
        this.formGenerator.navigateToPage(
          this.formGenerator.schema.app.pages[this.currentStep].id
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
    }

    if (nextButton) {
      nextButton.textContent =
        this.currentStep === this.totalSteps - 1 ? "Submit" : "Next";
    }

    // Update step indicator
    const steps = this.container.querySelectorAll(".step");
    steps.forEach((step, index) => {
      step.classList.toggle("active", index === this.currentStep);
    });
  }
}
