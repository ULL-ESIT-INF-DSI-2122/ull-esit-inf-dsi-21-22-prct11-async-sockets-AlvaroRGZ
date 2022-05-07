import * as net from 'net';
import {EventEmitter} from 'events';
import * as mt from '../messageClasses/messageTypes';
import chalk from 'chalk';
import * as fs from 'fs';
import {print, pError} from '../messageClasses/printer';

export class MessageEventEmitterServer extends EventEmitter {
  private userDir: string = 'src/notas/';
  constructor(private server: net.Server) {
    super();
    this.openServerOnPort(60300);
    let wholeData: string = '';
    server.on('connection', (connection) => {
      console.log('A client has connected.');

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

      this.on('request', (request: mt.RequestType) => {
        print('-----------------------------------------', 'yellow');
        print(`Receibed REQUEST from ${request.user}`, 'yellow');
        console.log(`Command: ${request.type}`);
        console.log(`User   : ${request.user}`);
        (request.title != undefined) ? console.log(`Title  : ${request.title}`): null;
        (request.body != undefined) ? console.log(`Body   : ${request.body}`): null;
        (request.color != undefined) ? console.log(`Color  : ${request.color}`): null;
        print('-----------------------------------------', 'yellow');
        switch (request.type) {
          case 'add':
            if (request.title && request.body && request.color) {
              const result = this.createNote(request.title, request.body, request.user, request.color);
              if (result == 'OK') {
                this.sendResponse({type: 'add', success: true, einfo: `${request.title}`}, connection);
              } else {
                this.sendResponse({type: 'add', success: false, einfo: result}, connection);
              }
            } else {

            }
            break;
            case 'modify':
            break;
          case 'delete':
            console.log(`Hago el comando delete`);
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
              pError('Note title Expected. Aborting...');
              this.sendResponse({type: 'read', success: false, einfo: 'Note title Expected. Aborting...'}, connection);
            }
            break;
          case 'list':
            const userNotes = this.listNotes(request.user);
              if (userNotes) {
                connection.write(JSON.stringify({type: 'list', success: true, notes: userNotes}) + '\n');
                // this.sendResponse({type: 'list', success: true, notes: userNotes}, connection);
              } else {
                connection.write(JSON.stringify({type: 'list', success: false, einfo: `Error listing ${request.user} notes.`}) + '\n');
                // this.sendResponse({type: 'list', success: false, einfo: `Error listing ${request.user} notes.`}, connection);
              }
            break;
          default:
            console.error(chalk.red('Tipo de respuesta desconocido'));
            break;
        }
        // Una vez atendida la peticion el servidor termina la comunicacion con el usuario
        connection.end();
      });
    });
  }
  openServerOnPort(port: number) {
    this.server.listen(port, () => {
      console.log('Waiting for clients to connect.');
    });
  }
  sendResponse(message: mt.ResponseType, socket: net.Socket) {
    socket.write(JSON.stringify(message) + '\n');
  }
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
