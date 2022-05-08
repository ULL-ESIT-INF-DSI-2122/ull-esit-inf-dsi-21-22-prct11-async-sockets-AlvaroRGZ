import {NoteServer} from './messageEventEmiterServer';

// Si no se especifica ningun parametro por defecto se escuchara por el puerto 60300
// Si el puerto indicado no es valido se recurre al por defecto
let port = 60300;
if (process.argv[2]) {
  port = parseInt(process.argv[2]);
  if (port < 4096) {
    port = 60300;
  }
}
// Inicia el servidor
const server = new NoteServer(port, undefined);

console.log('Pulse ^C para cerrar el servidor...');
