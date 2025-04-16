import { z } from "zod";

// Define the node data schema
const NodeDataSchema = z.object({
  type: z.string().describe("The type of the node data"),
  strokeWidth: z.number().optional().describe("The width of the stroke"),
  strokeColor: z.string().optional().describe("The color of the stroke"),
  fillColor: z.string().optional().describe("The fill color"),
  start: z.array(z.number()).optional().describe("The starting point [x, y]"),
  end: z.array(z.number()).optional().describe("The ending point [x, y]"),
  startMarker: z.string().optional().describe("The start marker type"),
  endMarker: z.string().optional().describe("The end marker type"),
  relation: z.string().optional().describe("The ID of the corresponding relation"),
}).passthrough(); // Allow additional properties

// Define the relation data schema
const RelationDataSchema = z.object({
  type: z.string().describe("The type of the relation data"),
  start: z.string().optional().describe("The ID of the source node"),
  end: z.string().optional().describe("The ID of the target node"),
  rel: z.string().optional().describe("A semantic relationship URI"),
  node: z.string().optional().describe("The ID of the arrow node"),
}).passthrough(); // Allow additional properties

export const OCIFSchemaDefinition = z
  .object({
    ocif: z.string().describe("The URI of the OCIF schema"),
    nodes: z
      .array(
        z
          .object({
            id: z.string().describe("A unique identifier for the node."),
            position: z
              .array(z.number())
              .describe("Coordinate as (x,y) or (x,y,z).")
              .optional(),
            size: z
              .array(z.number())
              .describe("The size of the node per dimension.")
              .optional(),
            resource: z.string().describe("The resource to display").optional(),
            data: z.array(NodeDataSchema).describe("Extended node data").optional(),
            rotation: z.number().describe("+/- 360 degrees").optional(),
            scale: z
              .array(z.number())
              .describe("Scale factors to resize nodes")
              .optional(),
          }).passthrough()
          .describe("A node in the OCIF document")
      )
      .describe("A list of nodes")
      .optional(),
    relations: z
      .array(
        z
          .object({
            id: z.string().describe("A unique identifier for the relation."),
            data: z
              .array(RelationDataSchema)
              .describe("Additional data for the relation.")
              .optional(),
          }).passthrough()
          .describe("A relation between nodes")
      )
      .describe("A list of relations")
      .optional(),
    resources: z
      .array(
        z
          .object({
            id: z.string().describe("A unique identifier for the resource."),
            representations: z
              .array(
                z
                  .object({
                    location: z
                      .string()
                      .describe(
                        "The storage location for the resource. This can be a relative URI for an external resource or an absolute URI for a remote resource. If a data: URI is used, the content and mime-type properties are implicitly defined already. Values in content and mime-type are ignored."
                      )
                      .optional(),
                    "mime-type": z
                      .string()
                      .describe("The IANA MIME Type of the resource.")
                      .optional(),
                    content: z
                      .string()
                      .describe(
                        "The content of the resource. This is the actual data of the resource as a string. Can be base64-encoded."
                      )
                      .optional(),
                  })
                  .describe(
                    "A representation of a resource. Either content or location MUST be present. If content is used, location must be left out and vice versa."
                  )
              )
              .describe("A list of representations of the resource."),
          })
          .describe("A resource in the OCIF document")
      )
      .describe("A list of resources")
      .optional(),
    
  }).passthrough()
  .describe(
    "The schema for the Open Component Interconnect Format (OCIF) Core document structure."
  );