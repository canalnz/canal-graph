import {Platform} from './bot';
import {nextSnowflake} from '../lib/snowflake';
import {db} from './index';

export interface Script {
  id: string;
  name: string;
  body: string;
  platform: Platform;
  resource_owner: string;
  created: Date;
  created_by: string;
  updated?: Date;
  updated_by?: string;
}
const scripts: Array<Partial<Script>> = [
  {
    id: 'script-001',
    name: 'autopin',
    platform: 'NODEJS',
    body: `command('test', m => m.reply('holy fuck, it works'))`,
    // body: `return 'Woohoo!' + alive`,
    resource_owner: 'user-001',
    created: new Date('2019-07-20T01:18:41.194Z')
  },
  {
    id: 'script-002',
    name: 'autodel',
    platform: 'NODEJS',
    body: 'if(sworded) delete()',
    resource_owner: 'user-001',
    created: new Date('2019-07-20T01:18:41.194Z')
  },
  {
    id: 'script-003',
    name: 'cachemessage',
    platform: 'NODEJS',
    body: 'command(cachemessage, () => {\n  getMessage(args.id)\n})',
    resource_owner: 'user-001',
    created: new Date('2019-07-20T01:18:41.194Z')
  },
  {
    id: 'script-004',
    name: 'channelconfig',
    platform: 'NODEJS',
    body: 'channel.config = await storage.get(`channel-config-${channel.id}`)',
    resource_owner: 'user-001',
    created: new Date('2019-07-20T01:18:41.194Z')
  },
  {
    id: 'script-005',
    name: 'randommeme',
    platform: 'NODEJS',
    body: 'every500Messages(() => send(randomMeme()))',
    resource_owner: 'user-001',
    created: new Date('2019-07-20T01:18:41.194Z')
  }
];

/* Create a script */
export interface ScriptCreateInput {
  name: string;
  body: string;
  platform: Platform;
  owner: string;
}
export async function createScript(scriptData: ScriptCreateInput): Promise<string> {
  const id = await nextSnowflake();
  const script = {
    id,
    created: new Date(),
    ...scriptData
  };
  await db.none('INSERT INTO scripts (id, name, body, platform, resource_owner, created, created_by) VALUES ' +
    '(${id}, ${name}, ${body}, ${platform}, ${owner}, ${created}, ${owner})', script);
  return id;
}
/* Gets all Scripts */
export async function getScriptsForUser(userId: string): Promise<Script[]> {
  return db.any('SELECT * FROM scripts WHERE resource_owner = $1', userId);
}
/* Gets a Script */
export async function getScript(id: string): Promise<Script | null> {
  return await db.oneOrNone('SELECT * FROM scripts WHERE id = $1', id);
}
/* Update a Script */
export interface ScriptUpdateInput {
  id: string;
  user?: string;
  name?: string;
  body?: string;
  platform?: Platform;
}
export async function updateScript(scriptData: ScriptUpdateInput): Promise<string> {
  await db.tx('update-script', (t) => {
    const queries = [
      t.none('UPDATE scripts SET updated = $2, updated_by = $3 WHERE id = $1', [
        scriptData.id,
        new Date(),
        scriptData.user || 0
      ])
    ];
    if (scriptData.body) queries.push(t.none('UPDATE scripts SET body = ${body} WHERE id = ${id}', scriptData));
    if (scriptData.name) queries.push(t.none('UPDATE scripts SET name = ${name} WHERE id = ${id}', scriptData));
    if (scriptData.platform) {
      queries.push(t.none('UPDATE scripts SET platform = ${platform} WHERE id = ${id}', scriptData));
    }
    return t.batch(queries);
  });

  return scriptData.id;
}
/* Deletes a given script */
export async function deleteScript(id: string): Promise<string> {
  await db.none('DELETE FROM scripts WHERE id = $1', id);
  await db.none('DELETE FROM script_links WHERE script_id = $1', id);
  return id;
}

export async function checkUserOwnsScript(scriptId: string, user: string): Promise<boolean> {
  const script = await db.oneOrNone('SELECT resource_owner FROM scripts WHERE id = $1', scriptId);
  return script && script.resource_owner === user;
}

