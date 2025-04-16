export interface OCIFSchema {
  $schema: string;
  title: string;
  description: string;
  type: string;
  properties: {
    ocif: {
      type: string;
      description: string;
    };
    nodes: {
      type: string;
      description: string;
      items: {
        $ref: string;
      };
    };
    relations: {
      type: string;
      description: string;
      items: {
        $ref: string;
      };
    };
    resources: {
      type: string;
      description: string;
      items: {
        $ref: string;
      };
    };
    schemas: {
      type: string;
      description: string;
      items: {
        $ref: string;
      };
    };
  };
  $defs: Record<string, any>;
  required: string[];
} 