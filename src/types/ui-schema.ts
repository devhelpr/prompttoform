export interface UISchema {
  $schema: string;
  $id: string;
  title: string;
  description: string;
  type: string;
  properties: {
    app: {
      type: string;
      properties: {
        title: {
          type: string;
        };
        pages: {
          type: string;
          items: {
            $ref: string;
          };
        };
        dataSources?: {
          type: string;
          items: {
            $ref: string;
          };
        };
      };
      required: string[];
    };
  };
  $defs: {
    page: {
      type: string;
      properties: {
        id: { type: string };
        title: { type: string };
        route: { type: string };
        layout: { type: string; enum: string[] };
        components: {
          type: string;
          items: {
            $ref: string;
          };
        };
        isEndPage: { type: string };
        branches?: {
          type: string;
          items: {
            $ref: "#/$defs/branch";
          };
        };
        nextPage?: { type: string };
      };
      required: string[];
    };
    componentBase: {
      type: string;
      properties: {
        id: { type: string };
        label?: { type: string };
        props?: { type: string; additionalProperties: boolean };
        children?: {
          type: string;
          items: {
            $ref: string;
          };
        };
        bindings?: {
          type: string;
          properties: {
            dataSource?: { type: string };
            field?: { type: string };
            onChange?: { type: string };
          };
        };
        validation?: {
          type: string;
          properties: {
            required?: { type: string };
            minLength?: { type: string };
            maxLength?: { type: string };
            pattern?: { type: string };
            minItems?: { type: string };
            maxItems?: { type: string };
            minDate?: { type: string };
            maxDate?: { type: string };
          };
        };
        visibilityConditions?: {
          type: string;
          items: {
            type: string;
            properties: {
              field: { type: string };
              operator: { type: string; enum: string[] };
              value: unknown;
            };
            required: string[];
          };
        };
        arrayItems?: {
          type: string;
          items: {
            $ref: string;
          };
        };
      };
      required: string[];
    };
    inputComponent: {
      allOf: [
        { $ref: string },
        { properties: { type: { const: string } }; required: string[] }
      ];
    };
    selectComponent: {
      allOf: [
        { $ref: string },
        { properties: { type: { const: string } }; required: string[] }
      ];
    };
    checkboxComponent: {
      allOf: [
        { $ref: string },
        { properties: { type: { const: string } }; required: string[] }
      ];
    };
    radioComponent: {
      allOf: [
        { $ref: string },
        { properties: { type: { const: string } }; required: string[] }
      ];
    };
    textareaComponent: {
      allOf: [
        { $ref: string },
        { properties: { type: { const: string } }; required: string[] }
      ];
    };
    buttonComponent: {
      allOf: [
        { $ref: string },
        { properties: { type: { const: string } }; required: string[] }
      ];
    };
    tableComponent: {
      allOf: [
        { $ref: string },
        { properties: { type: { const: string } }; required: string[] }
      ];
    };
    formComponent: {
      allOf: [
        { $ref: string },
        { properties: { type: { const: string } }; required: string[] }
      ];
    };
    sectionComponent: {
      allOf: [
        { $ref: string },
        { properties: { type: { const: string } }; required: string[] }
      ];
    };
    arrayComponent: {
      allOf: [
        { $ref: string },
        { properties: { type: { const: string } }; required: string[] }
      ];
    };
    dateComponent: {
      allOf: [
        { $ref: string },
        { properties: { type: { const: string } }; required: string[] }
      ];
    };
    textComponent: {
      allOf: [
        { $ref: string },
        { properties: { type: { const: string } }; required: string[] }
      ];
    };
    arrayItem: {
      type: string;
      properties: {
        id: { type: string };
        components: {
          type: string;
          items: {
            $ref: string;
          };
        };
      };
      required: string[];
    };
    component: {
      type: string;
      oneOf: [
        { $ref: string },
        { $ref: string },
        { $ref: string },
        { $ref: string },
        { $ref: string },
        { $ref: string },
        { $ref: string },
        { $ref: string },
        { $ref: string },
        { $ref: string },
        { $ref: string },
        { $ref: string }
      ];
    };
    eventHandlers: {
      type: string;
      properties: {
        onClick?: { $ref: string };
        onSubmit?: { $ref: string };
        onChange?: { $ref: string };
      };
    };
    action: {
      type: string;
      properties: {
        type: { type: string; enum: string[] };
        params?: { type: string; additionalProperties: boolean };
        dataSource?: { type: string };
        targetPage?: { type: string };
        message?: { type: string };
        branches?: {
          type: string;
          items: {
            type: string;
            properties: {
              condition: {
                type: string;
                properties: {
                  field: { type: string };
                  operator: { type: string; enum: string[] };
                  value: unknown;
                };
                required: string[];
              };
              nextPage: { type: string };
            };
            required: string[];
          };
        };
      };
      required: string[];
    };
    dataSource: {
      type: string;
      properties: {
        id: { type: string };
        type: { type: string; enum: string[] };
        url: { type: string };
        method?: { type: string; enum: string[] };
        query?: { type: string };
        params?: { type: string };
        responseMapping?: { type: string; additionalProperties: boolean };
      };
      required: string[];
    };
    branch: {
      type: string;
      properties: {
        condition: {
          type: string;
          properties: {
            field: { type: string };
            operator: { type: string; enum: string[] };
            value: { type: string };
          };
          required: string[];
        };
        nextPage: { type: string };
      };
      required: string[];
    };
  };
}
