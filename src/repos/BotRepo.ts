import * as crypto from 'crypto';
import {EntityRepository, getCustomRepository, Repository} from 'typeorm';
import Bot, {Platform} from '../entities/Bot';
import User from '../entities/User';
import {getBotSelf} from '../lib/discord';
import {nextSnowflake} from '../lib/snowflake';

export interface CreateBotData {
  token: string;
  platform: Platform;
  owner: User;
}

@EntityRepository(Bot)
export class BotRepository extends Repository<Bot> {
  public async findOneIfUserCanRead(id: string, user: User): Promise<Bot | null> {
    // It's only going to find it if it both exists *and* is owned by the user
    // Basically 404s rather than 403ing when perms aren't ok
    return await this.findOne({id, resourceOwnerId: user.id}) || null;
  }
  public async createAndSave({platform, token, owner}: CreateBotData): Promise<Bot> {
    const botData = await getBotSelf(token);
    if (!botData || !botData.id) throw new Error('That token doesn\'t appear to be valid');
    if (!botData.bot) throw new Error('Automating user accounts is against Discord ToS, and is prohibited');

    const bot = new Bot();
    bot.id = await nextSnowflake();
    bot.apiKey = crypto.randomBytes(32).toString('hex');
    bot.token = token;
    bot.platform = platform;
    bot.resourceOwnerId = owner.id;
    bot.createdById = owner.id;

    bot.name = botData.username;
    bot.discriminator = botData.discriminator;
    bot.discordId = botData.id;
    bot.avatarHash = botData.avatar;

    return this.save(bot);
  }
}

const getBotRepo = () => getCustomRepository(BotRepository);
export default getBotRepo;
