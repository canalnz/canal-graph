import * as BotDb from '../db/bot';
import {getBotSelf} from '../lib/discord';

export type Bot = BotDb.Bot;
export type BotUpdateInput = BotDb.BotUpdateInput;
export type Platform = BotDb.Platform;

export interface BotCreateInput {
  platform: Platform;
  token: string;
}
export interface BotCreateData extends BotCreateInput {
  user: string;
}
export async function createBot(data: BotCreateData): Promise<Bot> {
  // TODO a whole ton of logic here
  const botData = await getBotSelf(data.token);
  if (!botData || !botData.id) throw new Error('That token doesn\'t appear to be valid');
  if (!botData.bot) throw new Error('Automating user accounts is against Discord ToS, and is prohibited');
  const id = await BotDb.createBot({
    name: botData.username,
    discriminator: botData.discriminator,
    discordId: botData.id,
    token: data.token,
    avatar: botData.avatar,
    platform: data.platform,
    owner: data.user
  });
  return await BotDb.getBot(id) as Bot;
}

interface BotGetData {
  id: string;
  user: string;
}
export async function getBot(data: BotGetData): Promise<Bot | null> {
  if (!await checkUserOwnsBot(data.id, data.user)) {
    throw new Error(`Can't get bot ${data.id}: doesn't exist`);
  }
  return BotDb.getBot(data.id);
}
export async function getBotsForUser(user: string): Promise<Bot[]> {
  return BotDb.getBotsForUser(user);
}
export async function getBotWithKey(key: string): Promise<Bot | null> {
  return BotDb.getBotWithKey(key);
}

interface BotUpdateData extends BotUpdateInput {
  user: string;
}
export async function updateBot(data: BotUpdateData): Promise<Bot> {
  if (!await checkUserOwnsBot(data.id, data.user)) {
    throw new Error(`Can't update bit ${data.id}: doesn't exist`);
  }
  await BotDb.updateBot(data);
  return await BotDb.getBot(data.id) as Bot;
}

interface BotDeleteData {
  id: string;
  user: string;
}
export async function deleteBot(data: BotDeleteData): Promise<string> {
  if (!await checkUserOwnsBot(data.id, data.user)) {
    throw new Error(`Can't delete bot ${data.id}: doesn't exist`);
  }
  return BotDb.deleteBot(data.id);
}

export const checkUserOwnsBot = BotDb.checkUserOwnsBot;
