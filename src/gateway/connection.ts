import * as WebSocket from 'ws';
import * as http from 'http';
import getBotRepo from '../repos/BotRepo';
import getScriptLinkRepo from '../repos/ScriptLinkRepo';
import getScriptRepo from '../repos/ScriptRepo';
import {Script} from '../entities/Script';

const heartbeatInterval = 5 * 1000;
const heartbeatTimeoutDuration = 11 * 1000; // Kill if two heartbeats are missed

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
  public heartbeatTimeoutId: NodeJS.Timer | null = null;
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
  public async handleIdentify(payload: {token: string, client_info: any}) {
    if (!payload.token) return this.killConnection(4001, 'token is required for identify!');

    const bot = await getBotRepo().findOne({apiKey: payload.token});
    if (!bot) return this.killConnection(4004, 'We failed to authenticate you');
    // Beep boop, they're now authenticated!
    if (!bot.id) {
      console.error('wtf!?', bot);
    }
    console.log(`✅  Client ${bot.id} is connected!`);

    const scripts = await Promise.all(
      (await getScriptLinkRepo().find({botId: bot.id}))
        .map(async (s) => await getScriptRepo().findOne({id: s.scriptId}) as Script)
    );

    this.send('core.ready', {
      token: bot.token,
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
    if (this.heartbeatTimeoutId) clearTimeout(this.heartbeatTimeoutId);
    this.heartbeatTimeoutId = setTimeout(() => {
      this.killConnection(4000, 'We haven\'t received a heartbeat from you in a while. Are you dead?');
    }, heartbeatTimeoutDuration);
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
