import {db} from './index';

export type ScriptLinkId = [string, string];
export interface ScriptLink {
  script: string;
  bot: string;
  lastStarted: Date;
  added: Date;
  addedBy: string;
}

/* SCRIPTLINKS */
/* Adds a script as a ScriptLink */
export interface ScriptLinkCreateData {
  bot: string;
  script: string;
  user: string;
}
export async function createScriptLink({bot, script, user}: ScriptLinkCreateData): Promise<ScriptLink> {
  const link = {
    bot, script,
    lastStarted: new Date(),
    added: new Date(),
    addedBy: user
  };
  await db.none('INSERT INTO script_links (bot_id, script_id, last_started, added, added_by) ' +
  'VALUES (${bot}, ${script}, ${lastStarted}, ${added}, ${addedBy});', link);
  return link;
}
/* Gets a bunch of ScriptLinks */
export async function getScriptsLinksForBot(id: string): Promise<ScriptLink[]> {
  return db.any('SELECT * FROM script_links WHERE bot_id = $1', id);
}
/* Gets a given ScriptLink */
export async function getScriptLinkForBot(bot: string, script: string): Promise<ScriptLink | null> {
  return db.oneOrNone('SELECT * FROM script_links WHERE bot_id = $1 AND script_id = $2', [bot, script]);
}

/* Removes a ScriptLink */
export async function deleteScriptLink(bot: string, script: string): Promise<ScriptLinkId> {
  await db.none('DELETE FROM script_links WHERE bot_id = $1 AND script_id = $2', [bot, script]);
  return [bot, script];
}
