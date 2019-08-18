import * as WebSocket from 'ws';
import * as http from 'http';
import {getOptionsForBot, getScript, Script} from '../db';
import {getScriptsLinksForBot} from '../db/scriptLink';
import {getBotWithKey} from '../models/bot';

const heartbeatInterval = 5 * 1000;

type IncomingEventName = 'core.heartbeat' | 'core.identify' | 'core.update';
type OutgoingEventName = 'core.hello' | 'core.ready' | 'scripts.create' | 'options.create';

function EventHandler(event: IncomingEventName) {
  return (target: Connection, propertyKey: keyof Connection) => {
    target.socketEventHandlers = target.socketEventHandlers || {};
    target.socketEventHandlers[event] = propertyKey;
  };
}

export class Connection {
  public socketEventHandlers!: {[propName: string]: keyof Connection};
  public token: string = '';
  constructor(private socket: WebSocket, request: http.IncomingMessage) {
    this.sendHello();
    this.socket.on('message', (d) => this.handleMessage(d));
  }
  public sendHello() {
    this.send('core.hello', {
      heartbeat: heartbeatInterval
    });
  }

  @EventHandler('core.identify')
  public async handleIdentify(payload: {auth: string, client_info: any}) {
    if (!payload.auth) return this.killConnection(4001, 'auth parameter is required to identify!');

    const bot = await getBotWithKey(payload.auth);
    if (!bot) return this.killConnection(4004, 'We failed to authenticate you');
    // Beep boop, they're now authenticated!

    // You bet the client tells me who they are. Maybe they're me?! Who cares!
    console.log(`✅  Client ${bot.id} is connected!`);

    const scripts = await Promise.all(
      (await getScriptsLinksForBot(payload.client_info.id))
        .map(async (s) => await getScript(s.script) as Script)
    );

    this.send('core.ready', {
      options: await getOptionsForBot(payload.client_info.id),
      scripts: scripts.map((s) => ({
        id: s.id,
        name: s.name,
        body: s.body,
        platform: s.platform
      }))
    });
  }
  @EventHandler('core.heartbeat')
  public async handleHeartbeat() {
    // Don't really need to do anything here for MVP
  }

  private async handleMessage(d: WebSocket.Data) {
    const [eventName, payload] = this.deserialize(d);
    console.log(`👂️ ${eventName}`);
    const handlerName = this.socketEventHandlers[eventName];
    if (handlerName) {
      (this[handlerName] as (d: any) => void)(payload);
    } else throw new TypeError(`🔥 Got event ${eventName} from client, but don't have a handler for it!`);
  }
  private killConnection(code: number, message?: string) {
    if (!message) message = 'An unidentified error occurred';
    this.socket.close(code, JSON.stringify({code, message}));
  }
  private send(eventName: OutgoingEventName, payload?: any) {
    console.log(`🚀️ ${eventName}`);
    if (!payload) this.socket.send(this.serialize([eventName]));
    else this.socket.send(this.serialize([eventName, payload]));
  }
  private serialize(v: any) {
    return JSON.stringify(v);
  }
  private deserialize(v: any) {
    return JSON.parse(v.toString());
  }
}

export default Connection;
