import * as net from 'net';
import * as fs from 'fs';

const server = net.createServer((connection) => {
  console.log('A client has connected.');

  connection.write(JSON.stringify({'type': 'watch', 'file': 'data.txt'}) +
  '\n');

  fs.watchFile('./src/data.txt', (curr, prev) => {
    connection.write(JSON.stringify({
      'type': 'change', 'prevSize': prev.size, 'currSize': curr.size}) +
      '\n');
  });

  connection.on('close', () => {
    console.log('A client has disconnected');
  });
});

server.listen(60300, () => {
  console.log('Waiting for clients to connect.');
});
