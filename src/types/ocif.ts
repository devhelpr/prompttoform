export type OCIFJson = {
  version: string;
  nodes?: {
    [key: string]: {
      id: string;
      position?: [number, number];
      size?: [number, number];
      resource?: string;
      text?: string;
      data?: Array<{
        type: '@ocif/node/oval' | '@ocif/node/rectangle' | '@ocif/node/arrow';
        strokeWidth?: number;
        strokeColor?: string;
        fillColor?: string;
      }>;
    };
  };
  relations?: Array<{
    id: string;
    data: Array<{
      type: string;
      start: string;
      end: string;
      rel: string;
      node: string;
    }>;
  }>;
  resources?: Array<{
    id: string;
    representations?: Array<{
      'mime-type': string;
      content?: string;
      location?: string;
    }>;
  }>;
};

export interface ValidationError {
  path: string;
  message: string;
  line: number;
  column: number;
  details?: string;
  context?: string;
}

export interface Node {
  id: string;
  type: 'rectangle' | 'oval';
  width: number;
  height: number;
  x: number;
  y: number;
  text?: string;
  style: {
    type: 'rectangle' | 'oval';
    strokeWidth: number;
    strokeColor: string;
    fillColor: string;
  };
}

export interface Relation {
  from: string;
  to: string;
  path: string;
  type: string;
  rel: string;
} 