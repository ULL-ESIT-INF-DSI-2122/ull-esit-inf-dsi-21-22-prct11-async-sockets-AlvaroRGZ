import * as chalk from 'chalk';
/**
 * Colores para imprimir por pantalla con Chalk
 */
export type Color = 'white' | 'yellow' | 'green' | 'red' | 'blue';

/**
 * Estructura de un mensaje de tipo peticion
 */
export type RequestType = {
  type: 'add' | 'modify' | 'delete' | 'read' | 'list'; // Tipos de action soportados
  user: string;
  title?: string;
  body?: string;
  color?: Color;
  newTitle?: string;
}

/**
 * Estructura de un mensaje de tipo respuesta
 */
export type ResponseType = {
  // Indica que es una respuesta a esa accion solicitada
  type: 'add' | 'modify' | 'delete' | 'read' | 'list';
  success: boolean;
  notes?: Note[];
  einfo?: string;
}

/**
 * Estructura de una nota
 */
export type Note = {
  title: string;
  body: string;
  color: Color;
}
