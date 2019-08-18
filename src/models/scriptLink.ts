import * as ScriptLinkDb from '../db/scriptLink';
import * as ScriptDb from '../db/script';
import {checkUserOwnsBot} from './bot';

export type ScriptState = 'RUNNING' | 'PASSIVE' | 'ERRORED' | 'STOPPED';
export type ScriptLink = ScriptLinkDb.ScriptLink;

export async function createScriptLink(data: ScriptLinkDb.ScriptLinkCreateData): Promise<ScriptLink> {
  if (!await checkUserOwnsBot(data.bot, data.user) || !await checkUserOwnsScript(data.script, data.user)) {
    throw new Error(`Can't add script link for bot ${data.bot}: bot doesn't exist`);
  }
  return ScriptLinkDb.createScriptLink(data);
}

export interface ScriptLinkGetData {
  bot: string;
  script: string;
  user: string;
}
export async function getScriptLink({bot, script, user}: ScriptLinkGetData): Promise<ScriptLink | null> {
  if (!await checkUserOwnsBot(bot, user)) {
    throw new Error(`Can't get script link for bot ${bot}: bot doesn't exist`);
  }
  return ScriptLinkDb.getScriptLinkForBot(bot, script);
}
interface ScriptLinksGetData {
  bot: string;
  user: string;
}
export async function getScriptLinksForBot({bot, user}: ScriptLinksGetData): Promise<ScriptLink[]> {
  if (!await checkUserOwnsBot(bot, user)) {
    throw new Error(`Can't get script links for bot ${bot}: doesn't exist`);
  }
  return ScriptLinkDb.getScriptsLinksForBot(bot);
}

interface ScriptLinkDeleteData {
  script: string;
  bot: string;
  user: string;
}
export async function deleteScriptLink(data: ScriptLinkDeleteData): Promise<boolean> {
  if (!await checkUserOwnsScript(data.script, data.user) || !await checkUserOwnsBot(data.bot, data.user)) {
    throw new Error(`Can't remove link ${data.bot}-${data.user}: doesn't exist`);
  }

  await ScriptLinkDb.deleteScriptLink(data.bot, data.script);
  return true;
}

export const checkUserOwnsScript = ScriptDb.checkUserOwnsScript;
