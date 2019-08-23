import {EntityRepository, getCustomRepository, Repository} from 'typeorm';
import {BotPermission} from '../entities/BotPermission';
import Bot from '../entities/Bot';
import {nextSnowflake} from '../lib/snowflake';

export interface BotPermissionCreateData {
  bot: Bot;
  name: string;
}

@EntityRepository(BotPermission)
export class BotPermissionRepo extends Repository<BotPermission> {
  public async createAndSave({bot, name}: BotPermissionCreateData): Promise<BotPermission> {
    const perm = new BotPermission();
    perm.id = await nextSnowflake();
    perm.botId = bot.id;
    perm.name = bot.name;
    return this.save(perm);
  }
}

const getBotPermRepo = () => getCustomRepository(BotPermissionRepo);
export default getBotPermRepo;
