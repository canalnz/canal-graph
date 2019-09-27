/*
* Confusing file name explainer:
* This file is for the GraphQL/parent process
* It sends messages to the Gateway server, as well as
* receiving and forwarding them to the API
* */
import {fork, ChildProcess} from 'child_process';
import * as EventEmitter from 'events';
import * as path from 'path';
import {OutgoingEventName} from './client';
import {GatewayCommsEvent} from './index';

export class GatewayConnector extends EventEmitter {
  public ready: boolean = false;
  private child: ChildProcess | null = null;

  public setup(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.child = fork(path.resolve(__dirname, './index.js'));
      this.child.on('message', (m) => this.handleMessage(m));
      // This logic shouldn't really be needed, but could be a potential edge case
      if (this.ready) return resolve();
      this.once('ready', () => resolve());
    });
  }
  public handleMessage([command, payload]: GatewayCommsEvent) {
    if (command === 'SERVER_READY') {
      this.ready = true;
      this.emit('ready');
    } else throw new Error('The API is not capable of receiving Gateway events yet!!');
  }
  public send(clientId: string, eventName: OutgoingEventName, payload: any) {
    if (!this.child) throw new Error();
    this.child.send([
      'DIRECT',
      {
        client: clientId,
        event: eventName,
        payload
      }
    ]);
  }
}

export const gateway = new GatewayConnector();
