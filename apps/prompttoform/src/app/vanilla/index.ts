import { ExtendedFormSchema } from "./VanillaFormCore";
import { VanillaFormRenderer } from "./VanillaFormRenderer";

export function initFormGenerator(
  schema: ExtendedFormSchema,
  containerId: string
): void {
  const formRenderer = new VanillaFormRenderer(schema, containerId);
  formRenderer.init();
}
