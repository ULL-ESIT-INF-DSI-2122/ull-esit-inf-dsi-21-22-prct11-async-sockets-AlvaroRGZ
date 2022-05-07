import chalk from 'chalk';
import * as mt from './messageTypes';
/**
 * Funcion que imprime una cadena de un color determinado
 * @param s cadena a imprimir por pantalla
 * @param c color deseado para imprimir s
 */
export function print(s: string, c?: mt.Color) {
  switch (c) {
    case 'blue':
      console.log(chalk.blueBright(s));
      break;
    case 'red':
      console.log(chalk.redBright(s));
      break;
    case 'green':
      console.log(chalk.greenBright(s));
      break;
    case 'white':
      console.log(chalk.whiteBright(s));
      break;
    case 'yellow':
      console.log(chalk.yellowBright(s));
      break;
    default:
      console.log(chalk.whiteBright(s));
      break;
  }
}

/**
 * Muestra por la salida de erro el mensaje s en color rojo.
 * @param s cadena a mostrar
 */
export function pError(s: string | NodeJS.ErrnoException) {
  console.error(chalk.redBright(s));
}

export function printNote(note: mt.Note) {
  print(note.title, note.color);
  print(note.body, note.color);
}

/**
 * Funcion que imprime una cadena con un backGround determinado
 * @param s cadena a imprimir por pantalla
 * @param c color deseado para imprimir s
 */
/*
export function bgprint(s: string, c: string) {
  switch (c) {
    case 'blue':
      console.log(chalk.bgBlueBright(s));
      break;
    case 'red':
      console.log(chalk.bgRedBright(s));
      break;
    case 'green':
      console.log(chalk.bgGreenBright(s));
      break;
    case 'yellow':
      console.log(chalk.bgYellowBright(s));
      break;
    default:
      console.log(chalk.bgWhiteBright(s));
      break;
  }
}
*/
