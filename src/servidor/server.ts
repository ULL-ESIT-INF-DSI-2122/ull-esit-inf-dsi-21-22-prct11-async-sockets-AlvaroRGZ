import * as net from 'net';
import * as fs from 'fs';
// import {MessageEventEmitterClient} from '../messageClasses/messageEventEmiterClient';
import * as mt from '../messageClasses/messageTypes';
import {MessageEventEmitterServer} from './messageEventEmiterServer';

const serverObject = net.createServer();
const server = new MessageEventEmitterServer(serverObject);
