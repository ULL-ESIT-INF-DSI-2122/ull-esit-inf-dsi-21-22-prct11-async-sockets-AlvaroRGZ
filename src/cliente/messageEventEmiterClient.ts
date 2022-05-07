import * as net from 'net';
import {EventEmitter} from 'events';
import * as mt from '../messageClasses/messageTypes';
import chalk from 'chalk';
import {pError, print, printNote} from '../messageClasses/printer';

export class MessageEventEmitterClient extends EventEmitter {
  constructor(private connection: net.Socket) {
    super();

    let wholeData = '';
    connection.on('data', (dataChunk) => {
      wholeData += dataChunk;

      let messageLimit = wholeData.indexOf('\n');
      while (messageLimit !== -1) {
        const message = wholeData.substring(0, messageLimit);
        wholeData = wholeData.substring(messageLimit + 1);
        console.log(`Queda: ${wholeData}`);
        this.emit('response', JSON.parse(message));
        messageLimit = wholeData.indexOf('\n');
      }
    });

    this.on('response', (command: mt.ResponseType) => {
      console.log(`ENTRO A RESPONSE`);
      switch (command.type) {
        case 'add':
          if (command.success && command.einfo) { // Si se ha leido con exito
            print(command.einfo, 'green');
          } else if (command.success) { // Con exito pero sin especificar el nombre por algun error
            print(`Note added!`, 'green');
          } else if (command.einfo) { // Con error
            pError(command.einfo);
          }
          break;
          case 'modify':
          break;
        case 'delete':
          console.log(`Hago el comando delete`);
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
    connection.on('end', () => {
      console.log(`El server termino la comunicacion`);
      connection.end();
    });
  }
  sendRequest(message: mt.RequestType) {
    this.connection.write(JSON.stringify(message) + '\n');
  }
  getResponse(message: mt.RequestType) {

  }
}
