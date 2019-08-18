import * as BotDb from '../db/bot';
import * as ScriptDb from '../db/script';
import {checkUserOwnsScript} from './scriptLink';

// Hopefully this makes sense as a place to put business logic

export type Script = ScriptDb.Script;
export type Platform = BotDb.Platform;

export interface ScriptCreateData {
  name: string;
  body: string;
  platform: Platform;
  owner: string;
}
export async function createScript(data: ScriptCreateData): Promise<string> {
  return await ScriptDb.createScript(data);
}

interface ScriptGetData {
  id: string;
  user: string;
}
export async function getScript({id, user}: ScriptGetData): Promise<Script | null> {
  if (!await checkUserOwnsScript(id, user)) {
    throw new Error(`Can't get script ${id}: doesn't exist`);
  }
  return ScriptDb.getScript(id);
}

export async function getScriptsForUser(userId: string): Promise<Script[]> {
  return ScriptDb.getScriptsForUser(userId);
}

export interface ScriptUpdateData {
  id: string;
  user: string;
  name?: string;
  platform?: Platform;
  body?: string;
}
export async function updateScript(data: ScriptUpdateData): Promise<string> {
  return await ScriptDb.updateScript(data);
}

export interface ScriptDeleteData {
  id: string;
  user: string;
}
export async function deleteScript({id, user}: ScriptDeleteData): Promise<string> {
  const script = await ScriptDb.getScript(id);
  if (!script) throw new Error(`Can't delete script ${id}: doesn't exist`);
  // No need to inform the user that it exists, right?
  if (script.resource_owner !== user) throw new Error('`Can\'t delete script ${id}: doesn\'t exist`');
  return ScriptDb.deleteScript(id);
}
