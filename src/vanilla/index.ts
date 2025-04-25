import { FormGenerator } from "./FormGenerator";
import { FormSchema } from "./types";

export function initFormGenerator(
  schema: FormSchema,
  containerId: string
): FormGenerator {
  const formGenerator = new FormGenerator(schema, containerId);
  formGenerator.init();
  return formGenerator;
}
