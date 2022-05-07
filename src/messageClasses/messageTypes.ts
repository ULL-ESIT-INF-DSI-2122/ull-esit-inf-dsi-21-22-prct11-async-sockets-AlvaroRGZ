import * as chalk from 'chalk';
export type Color = 'white' | 'yellow' | 'green' | 'red' | 'blue';

export type RequestType = {
  type: 'add' | 'modify' | 'delete' | 'read' | 'list';
  user: string;
  title?: string;
  body?: string;
  color?: Color;
}

export type ResponseType = {
  type: 'add' | 'modify' | 'delete' | 'read' | 'list';
  success: boolean;
  notes?: Note[];
  einfo?: string;
}

export type Note = {
  title: string;
  body: string;
  color: Color;
}
