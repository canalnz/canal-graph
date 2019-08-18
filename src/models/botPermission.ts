import * as PermDb from '../db/botPermission';
import {db} from '../db';
import {checkUserOwnsBot} from './bot';

export type BotPermission = PermDb.BotPermission;
export type BotPermissionUpdateInput = PermDb.BotPermissionUpdateInput;
export type BotPermissionCreateInput = PermDb.BotPermissionCreateInput;

interface BotPermissionCreateData {
  name: string;
  bot: string;
  user: string;
}
export async function createBotPermission(data: BotPermissionCreateData): Promise<BotPermission> {
  if (!await checkUserOwnsBot(data.bot, data.user)) {
    throw new Error(`Can't create permission for bot ${data.bot}: that bot doesn't exist`);
  }
  return PermDb.createBotPermission(data);
}

interface BotPermissionGetData {
  id: string;
  user: string;
}
export async function getBotPermission(data: BotPermissionGetData): Promise<BotPermission> {
  const perm = await PermDb.getBotPermission(data.id);
  if (!perm || !checkUserOwnsBot(perm.bot_id, data.user)) {
    throw new Error(`Can't get permission ${data.id}: doesn't exist`);
  }
  return perm;
}

interface BotPermissionsGetData {
  bot: string;
  user: string;
}
export async function getBotPermissions(data: BotPermissionsGetData): Promise<BotPermission[]> {
  if (!await checkUserOwnsBot(data.bot, data.user)) {
    throw new Error(`Can't create permission for bot ${data.bot}: that bot doesn't exist`);
  }
  return PermDb.getBotPermissions(data.bot);
}

interface BotPermissionUpdateData extends PermDb.BotPermissionUpdateInput {
  user: string;
}
export async function updateBotPermission(data: BotPermissionUpdateData): Promise<BotPermission> {
  const botId = await db.oneOrNone('SELECT bot_id FROM bot_permissions WHERE id = ${id}', data);
  if (!botId || !await checkUserOwnsBot(botId, data.user)) {
    throw new ReferenceError(`Can't update bot permission ${data.id}: it doesn't exist`);
  }
  return PermDb.updateBotPermission(data);
}

interface BotPermissionDeleteData {
  id: string;
  user: string;
}
export async function deleteBotPermission(data: BotPermissionDeleteData): Promise<string> {
  // Check if the user owns the perm
  const botId = await db.oneOrNone('SELECT bot_id FROM bot_permissions WHERE id = ${id}', data);
  if (!botId || !await checkUserOwnsBot(botId, data.user)) {
    throw new ReferenceError(`Can't delete bot permission ${data.id}: it doesn't exist`);
  }
  await PermDb.deleteBotPermission(data.id);
  return data.id;
}
