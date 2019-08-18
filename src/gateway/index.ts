import * as WebSocket from 'ws';
import * as http from 'http';
import Connection from './connection';

export class GatewayServer {
  private server: WebSocket.Server;
  private connections: Connection[] = [];
  constructor(private port: number) {
    this.server = new WebSocket.Server({port});
    this.server.on('listening', (...args) => this.onListening(...args));
    this.server.on('connection', (...args) => this.onConnection(...args));
  }

  private onListening() {
    console.log('👂 Listening on port ' + this.port);
  }
  private onConnection(socket: WebSocket, request: http.IncomingMessage) {
    console.log('👋 We have a connection from ' + request.connection.remoteAddress);
    this.connections.push(new Connection(socket, request));
  }
}

export async function startGatewayServer(port: number) {
  return new GatewayServer(port);
}
