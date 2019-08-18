import {nextSnowflake} from '../lib/snowflake';
import {db} from './index';

export interface BotPermission {
  id: string;
  name: string;
  bot_id: string;
  qualifiers: BotPermissionQualifier[];
}
export type BotPermissionQualifierType = 'USER' | 'ROLE' | 'CHANNEL' | 'GUILD';
export interface BotPermissionQualifier {
  id: string;
  type: BotPermissionQualifierType;
  value: string;
}

export interface BotPermissionCreateInput {
  name: string;
  bot: string;
}
export async function createBotPermission(permData: BotPermissionCreateInput): Promise<BotPermission> {
  const id = await nextSnowflake();
  const perm: BotPermission = {
    id,
    qualifiers: [],
    bot_id: permData.bot,
    name: permData.name
  };
  await db.none('INSERT INTO bot_permissions (id, name, bot_id) ' +
    '(${id}, ${name}, ${bot_id}', perm);
  return perm;
}

export async function getBotPermissions(botId: string): Promise<BotPermission[]> {
  const permIds = await db.any('SELECT id FROM bot_permissions WHERE bot_id = $1', botId);
  return Promise.all(permIds.map((p) => getBotPermission(p.id)));
}
export async function getBotPermission(permId: string): Promise<BotPermission> {
  const perm = await db.oneOrNone('SELECT * FROM bot_permissions WHERE id = $1', permId);
  if (!perm) throw new ReferenceError(`Can't get permission ${permId}: doesn't exist`);
  const quals = await db.any('SELECT * FROM bot_permission_qualifiers WHERE perm_id = $1', permId);
  return {
    qualifiers: quals,
    ...perm
  };
}

export interface BotPermissionUpdateInput {
  id: string;
  name?: string;
  qualifiers?: BotPermissionQualifierInput[];
}
export interface BotPermissionQualifierInput {
  id?: string;
  delete?: true;
  type: BotPermissionQualifierType;
  value: string;
}
export async function updateBotPermission(updateData: BotPermissionUpdateInput): Promise<BotPermission> {
  if (updateData.name) await db.none('UPDATE bot_permissions SET name = ${name} WHERE id = ${id}', updateData);
  if (updateData.qualifiers) await Promise.all(updateData.qualifiers.map((q) => _updateQualifier(updateData.id, q)));
  return getBotPermission(updateData.id);
}
async function _updateQualifier(permId: string, qualifier: BotPermissionQualifierInput):
  Promise<BotPermissionQualifier | string> {
  if (!qualifier.id && qualifier.delete) throw new TypeError(`Qualifier cannot be missing ID and marked for deletion!`);
  // Create a qualifier
  if (!qualifier.id) {
    const qual = {
      id: await nextSnowflake(),
      type: qualifier.type,
      value: qualifier.value
    };
    await db.none('INSERT INTO bot_permission_qualifiers (id, type, value) VALUES ' +
      '(${id}, ${type}, ${value}', qual);
    return qual;
  }

  // Delete the qualifier
  if (qualifier.delete) {
    await db.none('DELETE FROM bot_permission_qualifiers WHERE id = ${id}', qualifier);
    return qualifier.id;
  } else {
    // Update qualifier
    await db.tx(async (t) => t.batch([
      qualifier.type && t.none('UPDATE bot_permission_qualifiers SET type = ${type} WHERE id = ${id}', qualifier),
      qualifier.value && t.none('UPDATE bot_permission_qualifiers SET value = ${type} WHERE id = ${id}', qualifier)
    ]));
    return await db.one('SELECT * FROM bot_permission_qualifiers WHERE id = ${id}', qualifier);
  }
}
export async function deleteBotPermission(permId: string): Promise<string> {
  await db.none('DELETE FROM bot_permissions WHERE id = $1', permId);
  await db.none('DELETE FROM bot_permission_qualifiers WHERE perm_id = $1', permId);
  return permId;
}
