import * as net from 'net';
import {EventEmitter} from 'events';
import * as mt from '../messageClasses/messageTypes';
import chalk from 'chalk';
import * as fs from 'fs';
import {print, pError} from '../messageClasses/printer';

/**
 * Clase que implementa un servidor controlador de notas de usuarios.
 * Hereda de EvenEmitter para controlar eventos personalizados
 */
export class NoteServer extends EventEmitter {
  private userDir: string = 'src/notas/';
  private server: net.Server;
  /**
   * Crea el servidor y lo activa.
   * Implementa los manejadores para los eventos necesarios
   * @param port puerto
   * @param serverOpts opciones para el servidor
   */
  constructor(port: number, serverOpts: net.ServerOpts | undefined) {
    super();
    this.server = net.createServer(serverOpts);                 // Creamos el socket con las opciones indicadas
    this.openServerOnPort(port);                               // escuchando en el puerto port
    this.server.on('connection', (connection) => {
      console.log('A client has connected.');
      // En el manejador del evento 'data', seguimos el protocolo de cuando
      // reciba un \n, la clase manejadora, al heredar de evenEmitter, emitira
      // el evento 'request' para indicar que ha recibido una peticion
      let wholeData: string = '';
      connection.on('data', (m) => {
        wholeData += m;
        let messageLimit = wholeData.indexOf('\n');
        while (messageLimit !== -1) {
          const message = wholeData.substring(0, messageLimit);
          wholeData = wholeData.substring(messageLimit + 1);
          this.emit('request', JSON.parse(message));
          messageLimit = wholeData.indexOf('\n');
        }
      });

      // En el manejador de request mostramos los datos de la peticion que hemos recibido
      this.on('request', (request: mt.RequestType) => {
        print('-----------------------------------------', 'yellow');
        print(`Receibed REQUEST from ${request.user}`, 'yellow');
        console.log(`Command   : ${request.type}`);
        console.log(`User      : ${request.user}`);
        (request.title   ) ? console.log(`Title     : ${request.title}`): null;
        (request.body    ) ? console.log(`Body      : ${request.body}`): null;
        (request.color   ) ? console.log(`Color     : ${request.color}`): null;
        (request.newTitle) ? console.log(`New title : ${request.newTitle}`): null;
        print('-----------------------------------------', 'yellow');
        // Comprobamos cual es la accion requerida
        switch (request.type) {
          case 'add':
            // Comprobamos que los parametros se hayan recibido correctamente
            if (request.title && request.body && request.color) {
              // Llevamos a cabo la accion
              const result = this.createNote(request.title, request.body, request.user, request.color);
              if (result == 'OK') {
                // Enviamos un mensaje de exito con el nombre del fichero creado
                this.sendResponse({type: 'add', success: true, einfo: `${request.title}`}, connection);
              } else {
                // Enviamos un mensaje de error con la info del erro devuelta de la funcion
                this.sendResponse({type: 'add', success: false, einfo: result}, connection);
              }
            } else {
              // Notificamos al cliente de que los datos no son validos
              this.sendResponse({type: 'add', success: false, einfo: 'Bad Arguments.'}, connection);
            }
            break;
            case 'modify':
              if (request.title && request.body && request.color && request.newTitle) {
                const result = this.modifyNote(request.title, request.newTitle,  request.body, request.user, request.color);
                if (result == 'OK') {
                  this.sendResponse({type: 'modify', success: true, einfo: `${request.title},${request.newTitle}`}, connection);
                } else {
                  this.sendResponse({type: 'modify', success: false, einfo: result}, connection);
                }
              } else {
                this.sendResponse({type: 'modify', success: false, einfo: 'Bad Arguments.'}, connection);
              }
            break;
          case 'delete':
            if (request.title && request.user) {
              const result = this.deleteNote(request.title, request.user);
              if (result == 'OK') {
                this.sendResponse({type: 'delete', success: true, einfo: `${request.title}`}, connection);
              } else {
                this.sendResponse({type: 'delete', success: false, einfo: result}, connection);
              }
            } else {
              this.sendResponse({type: 'delete', success: false, einfo: 'Bad Arguments.'}, connection);
            }
            break;
          case 'read':
            if (request.title) {
              const result = this.readNote(request.title, request.user);
              if (result) {
                this.sendResponse({type: 'read', success: true, notes: [this.readNote(request.title, request.user) as mt.Note]}, connection);
              } else {
                this.sendResponse({type: 'read', success: false, einfo: `Note ${request.title} does not exist.`}, connection);
              }
            } else {
              this.sendResponse({type: 'read', success: false, einfo: 'Note title Expected. Aborting...'}, connection);
            }
            break;
          case 'list':
            const userNotes = this.listNotes(request.user);
              if (userNotes) {
                this.sendResponse({type: 'list', success: true, notes: userNotes}, connection);
              } else {
                this.sendResponse({type: 'list', success: false, einfo: `Error listing ${request.user} notes.`}, connection);
              }
            break;
          default:
            console.error(chalk.red('Tipo de respuesta desconocido'));
            break;
        }
        // Una vez atendida la peticion el servidor termina la comunicacion con el usuario
        connection.end();
        this.removeAllListeners();
      });
    });
  }

  /**
   * Indica al server por que puerto debe atender.
   * @param port puerto donde escuchara el server
   */
  openServerOnPort(port: number) {
    this.server.listen(port, () => {
      console.log('Waiting for clients to connect.');
    });
  }
  /**
   * Manda un mensaje de tipo respuesta por el socket indicado.
   * @param message mensaje a enviar
   * @param socket socket por el que se enviaran los datos
   */
  sendResponse(message: mt.ResponseType, socket: net.Socket) {
    socket.write(JSON.stringify(message) + '\n');
  }
  /**
   * Crea una nota con los datos indicados.
   * Si hay algun error en el proceso devuelve una cadena con la info del error,
   * si no hay ningun problema retorna 'OK'
   * @param tittle titulo de la nota
   * @param body cuerpo de la nota
   * @param user propietario de la nota
   * @param color color de la nota
   */
  createNote(title: string, body: string, user: string, color: string): string {
    if (title === '' || body === '' ||
        user === '' || color === '' ) {
      console.log(chalk.redBright(`Error. Wrong arguments.`));
      return `Error. Wrong arguments.`;
    } else {
      if (!fs.existsSync(this.userDir + user)) {
        fs.mkdirSync(this.userDir + user, {recursive: true});
      }
      if (!fs.existsSync(this.userDir + user + '/' + title)) {
        fs.writeFileSync(this.userDir + user + '/' + title, JSON.stringify({title, body, color}, null, ' '));
      } else {
        console.log(chalk.redBright(`Error. ${title} already exists.`));
        return `Error. ${title} already exists.`;
      }
    }
    return 'OK';
  }
  /**
   * Elimina una nota.
   * Si hay algun error en el proceso devuelve una cadena con la info del error,
   * si no hay ningun problema retorna 'OK'
   * @param tittle titulo de la nota
   * @param user propietario de la nota
   */
  deleteNote(tittle: string, user: string): string {
    if (fs.existsSync(this.userDir + user)) {
      if (fs.existsSync(this.userDir + user + '/' + tittle)) {
        fs.rmSync(this.userDir + user + '/' + tittle);
      } else {
        return `Error. ${tittle} doesnt exist.`;
      }
    } else {
      return `Error. ${user} directory not found.`;
    }
    return 'OK';
  }
  /**
   * Modifica una nota indicada con los nuevos datos indicados.
   * Si hay algun error en el proceso devuelve una cadena con la info del error,
   * si no hay ningun problema retorna 'OK'
   * @param tittle titulo de la nota a modificar
   * @param newtitle nuevo titulo de la nota
   * @param body cuerpo de la nota
   * @param user propietario de la nota
   * @param color color de la nota
   */
  modifyNote(tittle: string, newtitle: string, body: string, user: string, color: string): string {
    if (fs.existsSync(this.userDir + user + '/' + tittle)) {
      this.deleteNote(tittle, user); // Borramos la anterior
      return this.createNote(newtitle, body, user, color); // Creamos una nueva
    } else {
      return `Error. ${tittle} not exists`;
    }
  }
  /**
   * Lista las notas de un determinado usuario.
   * Si hay algun error en el proceso devuelve una cadena con la info del error,
   * si no hay ningun problema retorna 'OK'
   * @param user usuario dueño de las notas a listar.
   */
  listNotes(user: string): mt.Note[] | undefined {
    const notes: mt.Note[] = [];
    let succes: boolean = true;
    if (fs.existsSync(this.userDir + user)) {
      const files: string[] = fs.readdirSync(this.userDir + user);
      files.forEach((f) => {
        const note = this.readNote(f, user);
        if (note) {
          notes.push(note);
        } else {
          succes = false;
        }
      });
    } else {
      console.log(chalk.redBright(`Error. Directory ${this.userDir + user} does not exit.`));
      succes = false;
    }
    if (succes) {
      return notes;
    } else {
      return undefined;
    }
  }
  /**
   * Lee una nota determinada de un usuario
   * Si hay algun error en el proceso devuelve una cadena con la info del error,
   * si no hay ningun problema retorna 'OK'
   * @param user propietario de la nota
   * @param title titulo de la nota
  */
  readNote(title: string, user: string): mt.Note | undefined {
    const note: mt.Note = {title: '', body: '', color: 'blue'};
    let succes: boolean = false;
    if (fs.existsSync(this.userDir + user)) {
      if (fs.existsSync(this.userDir + user + '/' + title)) {
        const noteTitle: string = this.getNoteAtributteSync(title, user, 'title') as string;
        const noteBody: string = this.getNoteAtributteSync(title, user, 'body') as string;
        const noteColor: mt.Color = this.getNoteAtributteSync(title, user, 'color') as mt.Color;
        if (noteTitle !== undefined && noteBody !== undefined && noteColor !== undefined) {
          note.title = noteTitle;
          note.body  = noteBody;
          note.color = noteColor;
          succes = true;
        } else {
          console.log(chalk.redBright(`Error. Accesing ${title} atributes.`));
        }
        console.log();
      } else {
        console.log(chalk.redBright(`Error. ${title} does not exist.`));
      }
    } else {
      console.log(chalk.redBright(`Error. ${this.userDir + user} directory not found.`));
    }
    if (succes) {
      return note;
    } else {
      return undefined;
    }
  }
  /**
 * Version asincrona del metodo getNoteAtributte implementado mas abajo.
 * Implementa el patron Calback.
 * @param tittle titulo de la nota
 * @param user usuario propietario
 * @param attr atributo que se desea obtener de la nota
 * @returns el valor del atributo especificado
 */
  getNoteAtributte = ((title: string, user: string, attr: string,
                  callBack: (error: string | undefined, data: string | undefined) => void) => {
    if (fs.existsSync(this.userDir + user)) {
      if (fs.existsSync(this.userDir + user + '/' + title)) {
        fs.readFile(this.userDir + user + '/' + title, (error, data) => {
          if (error) {
            callBack(error.message, undefined);
          } else {
            switch (attr) {
              case 'title':
                callBack(undefined, JSON.parse(data.toString()).title);
                break;
              case 'color':
                callBack(undefined, JSON.parse(data.toString()).color);
                break;
              case 'body':
                callBack(undefined, JSON.parse(data.toString()).body);
                break;
            }
          }
        });
      } else {
        console.log(chalk.redBright(`Error. ${title} doesnt exist.`));
      }
    } else {
      console.log(chalk.redBright(`Error. ${user} directory not found.`));
    }
  });

  /**
   * Emplea una lectura sincrona para poder retornar el valor del atributo leido
   * @param tittle titulo de la nota
   * @param user usuario propietario
   * @param attr atributo que se desea obtener de la nota
   * @returns el valor del atributo especificado
   */
  getNoteAtributteSync(title: string, user: string, attr: string): string | undefined {
    let out: string = '';
    if (fs.existsSync(this.userDir + user)) {
      if (fs.existsSync(this.userDir + user + '/' + title)) {
        switch (attr) {
          case 'title':
            out = JSON.parse(fs.readFileSync(this.userDir + user + '/' + title).toString()).title;
            break;
          case 'color':
            out = JSON.parse(fs.readFileSync(this.userDir + user + '/' + title).toString()).color;
            break;
          case 'body':
            out = JSON.parse(fs.readFileSync(this.userDir + user + '/' + title).toString()).body;
            break;
        }
      } else {
        console.log(chalk.redBright(`Error. ${title} doesnt exist.`));
      }
    } else {
      console.log(chalk.redBright(`Error. ${user} directory not found.`));
    }
    if (out !== '') {
      return out;
    } else {
      return undefined;
    }
  }
}
