import 'mocha';
import {expect} from 'chai';
import * as s from './servidor/noteServer';

const server = new s.NoteServer(60600, undefined);

describe('Pruebas Note App con sockets', () => {
  describe('Pruebas Funciones', () => {
    describe('FUNCION: getNoteAtributte', () => {
      it('Funciona getNoteAtributte', () => {
        expect(server.getNoteAtributteSync('pr1', 'pruebas', 'color')).to.be.deep.equal('pr1');
        expect(server.getNoteAtributteSync('pr1', 'pruebas', 'color')).to.be.deep.equal('blue');
        expect(server.getNoteAtributteSync('pr1', 'pruebas', 'body')).to.be.deep.equal('Estos ficheros');
      });
      it('No funciona getNoteAtributte con malos argumentos', () => {
        expect(server.getNoteAtributteSync('pr1', 'pruebas', 'papas')).to.be.deep.equal(undefined);
        expect(server.getNoteAtributteSync('pr1', 'nodir', 'papas')).to.be.deep.equal(undefined);
        expect(server.getNoteAtributteSync('nofile', 'pruebas', 'tittle')).to.be.deep.equal(undefined);
        expect(server.getNoteAtributteSync('nofile', 'pruebas', 'body')).to.be.deep.equal(undefined);
      });
    });
  });
});
