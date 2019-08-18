import * as crypto from 'crypto';
import {nextSnowflake} from '../lib/snowflake';
import {db, deleteBotPermission} from './index';

export type Platform = 'NODEJS';

export interface Bot {
  id: string;
  name: string;
  discriminator: string;
  discord_id: string;
  token: string;
  avatar_hash: string;
  platform: Platform;
  api_key: string;
  resource_owner: string;
  created: Date;
  created_by: string;
}

/* BOTS */
/* Create a bot */
interface BotCreateData {
  name: string;
  discriminator: string;
  discordId: string;
  token: string;
  avatar: string;
  platform: Platform;
  owner: string;
}
export async function createBot(botData: BotCreateData): Promise<string> {
  const id = await nextSnowflake();
  const apiKey = crypto.randomBytes(32).toString('hex');
  console.log(`Beep boop, making bot ${botData.name} wit hid ${id}`);
  const bot = {
    ...botData,
    id,
    apiKey,
    created: new Date(),
  };
  await db.none('INSERT INTO bots (id, name, discriminator, discord_id, token, avatar_hash, platform, ' +
    'api_key, resource_owner, created, created_by) VALUES (${id}, ${name}, ${discriminator}, ${discordId}, ${token}, ' +
    '${avatar}, ${platform}, ${apiKey}, ${owner}, ${created}, ${owner});', bot);
  return id;
}
/* Gets all bots */
export async function getBotsForUser(userId: string): Promise<Bot[]> {
  return db.any('SELECT * FROM bots WHERE resource_owner = $1', userId);
}
/* Get a Bot */
export async function getBot(id: string): Promise<Bot | null> {
  return db.oneOrNone('SELECT * FROM bots WHERE id = $1', id);
}

export async function getBotWithKey(key: string): Promise<Bot | null> {
  return db.oneOrNone('SELECT * FROM bots WHERE api_key = $1', key);
}

/* Update a Bot */
export interface BotUpdateInput {
  id: string;
  platform?: Platform;
}
export async function updateBot(botData: BotUpdateInput): Promise<string> {
  if (botData.platform) await db.none('UPDATE bots SET platform = ${platform} WHERE id = ${id}', botData);
  return botData.id;
}
/* Delete a given Bot */
export async function deleteBot(id: string): Promise<string> {
  await db.tx(async (t) => {
    const perms = await db.any('SELECT id FROM bot_permissions WHERE bot_id = $1', id);
    return t.batch([
      db.none('DELETE FROM bots WHERE id = $1', id),
      db.none('DELETE FROM script_links WHERE bot_id = $1', id),
      db.none('DELETE FROM bot_auth_cache WHERE bot_id = $1', id),
      db.none('DELETE FROM bot_options WHERE bot_id = $1', id),
      perms.map((p) => deleteBotPermission(p))
    ]);
  });
  return id;
}

export async function checkUserOwnsBot(botId: string, user: string): Promise<boolean> {
  const bot = await db.oneOrNone('SELECT resource_owner FROM bots WHERE id = $1', botId);
  return bot && bot.resource_owner === user;
}

/* BOT OPTIONS */
export interface BotOptions {
  [prop: string]: any;
  token: string;
  command_mode: string;
}

/* Get BotOptions for a Bot */
export async function getOptionsForBot(id: string): Promise<BotOptions> {
  const optList = await db.any('SELECT * FROM bot_options WHERE bot_id = $1', id);
  const opts: Partial<BotOptions> = {};
  optList.forEach((o) => opts[o.key] = o.value);
  return opts as BotOptions;
}
export async function getOptionForBot(data: {id: string, key: string}): Promise<any> {
  return db.oneOrNone('SELECT value FROM bot_options WHERE bot_id = ${id} AND key = ${key}', data);
}

export interface BotOptionsSetData {
  id: string;
  key: string;
  value: any;
}
export async function setOptionForBot(data: BotOptionsSetData): Promise<string> {
  await db.none('UPDATE bot_options SET value = ${value} WHERE bot_id = ${id} AND key = ${key}', data);
  return data.id;
}

export async function deleteOptionsForBot(data: {id: string, key: string}): Promise<string> {
  await db.none('DELETE FROM bot_options WHERE bot_id = ${id} AND key = ${key}', data);
  return data.id;
}
