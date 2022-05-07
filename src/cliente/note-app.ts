import {connect} from 'net';
import {MessageEventEmitterClient} from './messageEventEmiterClient';
import * as mt from '../messageClasses/messageTypes';

const socket = connect({port: 60300});
const client = new MessageEventEmitterClient(socket);

import * as yargs from 'yargs';
import chalk from 'chalk';

const noteTittle: string = 'Note title';
const userName: string = 'User name';

/**
 * Funcion para implementar el comando add.
 * Añade una nota
 * @param user propietario de la nota
 * @param title titulo de la nota
 * @param body cuerpo de la nota
 * @param color de la nota
 */
yargs.command({
  command: 'add',
  describe: 'Add a new note',
  builder: {
    user: {
      describe: userName,
      demandOption: true,
      type: 'string',
    },
    title: {
      describe: noteTittle,
      demandOption: true,
      type: 'string',
    },
    body: {
      describe: 'Note body',
      demandOption: true,
      type: 'string',
    },
    color: {
      describe: 'Note color',
      demandOption: true,
    },
  },
  handler(argv) {
    if (typeof argv.title === 'string' && typeof argv.user === 'string' &&
        typeof argv.body === 'string') {
      client.sendRequest({type: 'add', user: argv.user, title: argv.title, body: argv.body, color: argv.color as mt.Color});
    }
  },
});

/**
 * Funcion para implementar el comando modify.
 * Modifica una nota existente
 * @param user propietario de la nota
 * @param title titulo de la nota a modificar
 * @param newtitle nuevo titulo de la nota
 * @param body nuevo cuerpo de la nota
 * @param color nuevo color de la nota
 */
yargs.command({
  command: 'modify',
  describe: 'Modify a note',
  builder: {
    user: {
      describe: userName,
      demandOption: true,
      type: 'string',
    },
    title: {
      describe: noteTittle,
      demandOption: true,
      type: 'string',
    },
    newtitle: {
      describe: noteTittle,
      demandOption: true,
      type: 'string',
    },
    body: {
      describe: 'New note body',
      demandOption: true,
      type: 'string',
    },
    color: {
      describe: 'New note color',
      demandOption: true,
      type: 'string',
    },
  },
  handler(argv) {
    if (typeof argv.title === 'string' && typeof argv.user === 'string' &&
        typeof argv.body === 'string' && typeof argv.color === 'string' &&
        typeof argv.newtitle === 'string') {

    }
  },
});

/**
 * Funcion para implementar el comando read.
 * Lee una nota determinada de un usuario
 * @param user propietario de la nota
 * @param title titulo de la nota
 */
yargs.command({
  command: 'read',
  describe: 'Read a note',
  builder: {
    user: {
      describe: userName,
      demandOption: true,
      type: 'string',
    },
    title: {
      describe: noteTittle,
      demandOption: true,
      type: 'string',
    },
  },
  handler(argv) {
    if (typeof argv.title === 'string' && typeof argv.user === 'string') {
      client.sendRequest({type: 'read', user: argv.user, title: argv.title});
    }
  },
});

/**
 * Funcion para implementar el comando delete.
 * Borra una nota determinada de un usuario
 * @param user propietario de la nota
 * @param title titulo de la nota
 */
yargs.command({
  command: 'delete',
  describe: 'Delete a note',
  builder: {
    user: {
      describe: userName,
      demandOption: true,
      type: 'string',
    },
    title: {
      describe: noteTittle,
      demandOption: true,
      type: 'string',
    },
  },
  handler(argv) {
    if (typeof argv.title === 'string' && typeof argv.user === 'string') {

    }
  },
});

/**
 * Funcion para implementar el comando list.
 * Lista las notas de un usuario
 * @param user usuario selecionado para listar sus notas
 * @param ot OnlyTitles flag para determinar si se imprimen solo los titulos o no
 *           Si se expresa --ot entonces solo se mostraran los titulos, en otro
 *           caso, se mostraran las notas completas.
 */
yargs.command({
  command: 'list',
  describe: 'List user notes',
  builder: {
    user: {
      describe: 'Users note list',
      demandOption: true,
      type: 'string',
    },
    ot: {
      describe: 'Only titles',
      demandOption: false,
      boolean: true,
    },
  },
  handler(argv) {
    if (typeof argv.user === 'string') {
      client.sendRequest({type: 'list', user: argv.user});
    }
  },
});

/**
 * Funcion para interpretar los comandos
 */
yargs.parse();

