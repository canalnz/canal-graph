import * as EventEmitter from 'events';
import getBotRepo from '../repos/BotRepo';
import getScriptLinkRepo from '../repos/ScriptLinkRepo';
import getScriptRepo from '../repos/ScriptRepo';
import {Script} from '../entities/Script';
import Bot from '../entities/Bot';
import Connection from './connection';

type IncomingEventName = 'HEARTBEAT' | 'IDENTIFY' | 'CLIENT_STATUS_UPDATE' | 'SCRIPT_STATUS_UPDATE';
type OutgoingEventName = 'HELLO' | 'READY' | 'SCRIPT_CREATE' | 'OPTIONS_UPDATE';

function EventHandler(event: IncomingEventName) {
  return (target: Client, propertyKey: keyof Client) => {
    target.socketEventHandlers = target.socketEventHandlers || {};
    target.socketEventHandlers[event] = propertyKey;
  };
}

export class Client extends EventEmitter {
  public socketEventHandlers: {[propName: string]: keyof Client} | undefined;
  public token: string | null = null;
  public id: string;
  constructor(private connection: Connection, public bot: Bot) {
    super();
    this.id = bot.id;
    this.connection.on('message', (e, p) => this.onMessage(e, p));
    this.connection.on('close', (c, m) => this.onClose(c, m));

    this.sendReady();
  }

  public async sendEvent(payload: any) {
    console.log(`[Client ${this.bot.name}]: ${payload}`);
  }

  public async sendReady() {
    const scripts = await Promise.all(
      (await getScriptLinkRepo().find({botId: this.bot.id}))
        .map(async (s) => await getScriptRepo().findOne({id: s.scriptId}) as Script)
    );

    this.send('READY', {
      token: this.bot.token,
      scripts: scripts.map((s) => ({
        id: s.id,
        name: s.name,
        body: s.body,
        platform: s.platform
      }))
    });
  }

  private onMessage(eventName: string, payload: string) {
    if (eventName === 'HEARTBEAT') return; // We can ignore this, the connection handled this at a lower level
    const handlerName = this.socketEventHandlers && this.socketEventHandlers[eventName];
    if (handlerName) {
      (this[handlerName] as (d: any) => void)(payload);
    } else console.error(`🔥 Got event ${eventName} from client, but don't have a handler for it!`);
  }
  private onClose(code: number, message: string) {
    console.log(`Connection ${this.bot ? this.bot.name : 'anonymous'} has been closed: [${code}] ${message}`);
    this.emit('close');
  }
  private send(eventName: OutgoingEventName, payload?: any) {
    this.connection.send(eventName, payload);
  }
}

export default Connection;
