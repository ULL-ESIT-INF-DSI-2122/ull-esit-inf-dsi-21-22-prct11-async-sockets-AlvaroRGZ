import * as net from 'net';
import {EventEmitter} from 'events';
import * as mt from '../messageClasses/messageTypes';
import chalk from 'chalk';
import {pError, print, printNote} from '../messageClasses/printer';

/**
 * Clase que implementa un cliente de la app de notas de usuarios.
 * Hereda de EvenEmitter para controlar eventos personalizados
 */
export class NoteClient extends EventEmitter {
    /**
   * Implementa los manejadores para los eventos necesarios
   * @param connection socket conectado al server
   */
  constructor(private connection: net.Socket) {
    super();

    // En el manejador del evento 'data', seguimos el protocolo de cuando
    // reciba un \n, la clase manejadora, al heredar de evenEmitter, emitira
    // el evento 'response' para indicar que ha recibido una respuesta
    let wholeData = '';
    connection.on('data', (dataChunk) => {
      wholeData += dataChunk;
      let messageLimit = wholeData.indexOf('\n');
      while (messageLimit !== -1) {
        const message = wholeData.substring(0, messageLimit);
        wholeData = wholeData.substring(messageLimit + 1);
        this.emit('response', JSON.parse(message));
        messageLimit = wholeData.indexOf('\n');
      }
    });

    // En el manejador de response, que se ejecutara cuando reciba una respuesta,
    // informamos al usuario de los resultados de la operacion
    this.on('response', (command: mt.ResponseType) => {
      switch (command.type) {
        case 'add':
          if (command.success && command.einfo) { // Si ha habido exito y se ha enviado un mensaje de informacion
            print(`${command.einfo} added!`, 'green');
          } else if (command.success) { // Con exito pero sin informacion adicional
            print(`Note added!`, 'green');
          } else if (command.einfo) { // Con error
            pError(command.einfo);
          }
          break;
          case 'modify':
            if (command.success && command.einfo) {
              const data = command.einfo.split(',');
              print(`${data[0]} modified. Now: ${data[1]}!`, 'green');
            } else if (command.success) {
              print(`Note deleted!`, 'green');
            } else if (command.einfo) {
              pError(command.einfo);
            }
          break;
        case 'delete':
          if (command.success && command.einfo) {
            print(`${command.einfo} deleted!`, 'green');
          } else if (command.success) {
            print(`Note deleted!`, 'green');
          } else if (command.einfo) {
            pError(command.einfo);
          }
          break;
        case 'read':
          if (!command.einfo) { // Si se ha leido con exito
            if (command.notes) { // Si se ha recibido la nota
              command.notes.forEach((note) => {
                printNote(note);
              });
            } else {
              pError(`El servidor no ha enviado ninguna nota`);
            }
          } else {
            pError(command.einfo);
          }
          break;
        case 'list':
          if (!command.einfo) { // Si se ha leido con exito
            if (command.notes) { // Si se ha recibido la nota
              command.notes.forEach((note) => {
                printNote(note);
              });
            } else {
              pError(`El servidor no ha enviado ninguna nota`);
            }
          } else {
            pError(command.einfo);
          }
          break;
        default:
          console.error(chalk.red('Tipo de respuesta desconocido'));
          break;
      }
    });
    // Cuando el server ha mandado la respuesta termina el programa
    connection.on('end', () => {
      console.log(`El server termino la comunicacion`);
      connection.end();
    });
  }
  /**
   * Envia una peticion al server por el socket
   * @param message peticion
   */
  sendRequest(message: mt.RequestType) {
    this.connection.write(JSON.stringify(message) + '\n');
  }
}
