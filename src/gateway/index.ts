/*
  Remember folks, child processes need absolutely everything setup again.
  That database singleton you're so fond of? It needs reinstantiating!
* */
import 'reflect-metadata';
import {GatewayServer, startGatewayServer} from './server';
import {createDbConnection} from '../lib/database';

export type GatewayCommsMessage<T> = [T, any];
export type GatewayCommsEventName = 'SERVER_READY' | 'SCRIPT_STATE_CHANGE' | 'CLIENT_STATE_UPDATE';
export type GatewayCommsEvent = GatewayCommsMessage<GatewayCommsEventName>;
export type GatewayCommsCommandName = 'BROADCAST' | 'DIRECT';
export type GatewayCommsCommand = GatewayCommsMessage<GatewayCommsCommandName>;

const port = process.env.GATEWAY_PORT || process.env.PORT || 80;

if (!process.send || module.parent) {
  throw new Error('This module is designed to be run in a forked process.' +
    'If you\'re requiring this, you\'re doing something wrong!!');
}

async function main() {
  // This is a separate process. We need to instantiate the DB again
  const conn = await createDbConnection();
  const server = await startGatewayServer(+port);
  process.on('message', (m) => handleCommand(m, server));
  sendEvent('SERVER_READY');
}

function sendEvent(command: GatewayCommsEventName, payload: any = null) {
  if (!process.send) return;
  process.send([command, payload]);
}

async function handleCommand([command, payload]: GatewayCommsCommand, server: GatewayServer): Promise<void> {
  if (command === 'DIRECT') return server.sendEvent(payload.client, payload.event, payload.payload);
  throw new Error(`Gateway is not capable of handling ${command} commands yet!`);
}

main();
