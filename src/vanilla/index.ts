import { FormRenderer } from "./FormRenderer";
import { ExtendedFormSchema } from "./FormGenerator";

export function initFormGenerator(
  schema: ExtendedFormSchema,
  containerId: string
): FormRenderer {
  const formRenderer = new FormRenderer(schema, containerId);
  formRenderer.init();
  return formRenderer;
}
