import { FormGenerator } from "./FormGenerator";
import { ExtendedFormSchema } from "./FormGenerator";

export function initFormGenerator(
  schema: ExtendedFormSchema,
  containerId: string
): FormGenerator {
  const formGenerator = new FormGenerator(schema, containerId);
  formGenerator.init();
  return formGenerator;
}
