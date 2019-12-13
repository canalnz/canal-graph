import {GraphContext, Paginated} from '../typeDefs';
import {
  Bot,
  getBotRepo,
  getModuleLinkRepo,
  getUserRepo,
  ModuleLink,
  User
} from '@canalapp/shared/dist/db';
import {Platform} from '@canalapp/shared/dist/constants';

export interface BotCreateInput {
  platform: Platform;
  token: string;
}
export interface BotUpdateInput {
  id: string;
  platform?: Platform;
}

const botResolvers = {
  Query: {
    bot(parent: void, args: { id: string }, context: GraphContext): Promise<Bot | null> {
      return getBotRepo().findOneIfUserCanRead(args.id, context.user);
    },
    async bots(parent: void, args: void, context: GraphContext): Promise<Paginated<Bot>> {
      const bots = await getBotRepo().find({resourceOwnerId: context.user.id});
      return {
        nodes: bots,
        totalCount: bots.length
      };
    }
  },
  Mutation: {
    async createBot(parent: void, {bot}: {bot: BotCreateInput}, context: GraphContext): Promise<Bot> {
      return getBotRepo().createAndSave({
        ...bot,
        owner: context.user
      });
    },
    // Currently this is only used for changing the platform
    async updateBot(parent: void, {bot: updateData}: {bot: BotUpdateInput}, context: GraphContext): Promise<Bot> {
      const botRepo = getBotRepo();
      const bot = await botRepo.findOneIfUserCanRead(updateData.id, context.user);
      if (!bot) throw new Error('Couldn\'t find that bot :(');
      if (!updateData.platform) return bot; // idk why this would happen but 🤷‍

      bot.platform = updateData.platform;
      return await botRepo.save(bot);
    },
    async deleteBot(parent: void, args: {bot: string}, context: GraphContext): Promise<string> {
      const botRepo = getBotRepo();
      const bot = await botRepo.findOneIfUserCanRead(args.bot, context.user);
      if (!bot) throw new Error('Couldn\'t find that bot :(');
      await botRepo.remove(bot);
      return args.bot;
    }
  },
  Bot: {
    __resolveType(bot: Bot, context: GraphContext, info: void) {
      if (bot.platform === 'DISCORD') return 'DiscordBot';
      if (bot.platform === 'SLACK') return 'SlackBot';
      else return null;
    },
    // id can default
    // name can default
    // avatarHash can default
    async avatarUrl(parent: Bot): Promise<string> {
      return parent.getAvatarUrl();
    },
    // runtime can default
    async resourceOwner(parent: Bot): Promise<User> {
      return await getUserRepo().findOneOrFail({id: parent.resourceOwnerId});
    },
    // created can default
    async createdBy(parent: Bot): Promise<User | null> {
      // Just being lazy and using the resource owner as creator
      return await getUserRepo().findOne({id: parent.resourceOwnerId}) || null;
    },
    async modules(parent: Bot, args: void, context: GraphContext): Promise<Paginated<ModuleLink>> {
      // We can go ahead and load these modules, because only trusted people can load the root bot
      const moduleLinkRepo = getModuleLinkRepo();
      const modules = await moduleLinkRepo.find({botId: parent.id});
      return {
        nodes: modules,
        totalCount: modules.length
      };
    },
    async module(parent: Bot, args: {id: string}, context: GraphContext): Promise<ModuleLink | null> {
      return await getModuleLinkRepo().findOne({botId: parent.id, moduleId: args.id}) || null;
    }
  },
  DiscordBot: {
    async discordUsername(parent: Bot): Promise<string> {
      return (await parent.discordDetails).username;
    },
    async discordDiscriminator(parent: Bot): Promise<string> {
      return (await parent.discordDetails).discriminator;
    },
    async discordId(parent: Bot): Promise<string> {
      return (await parent.discordDetails).discordId;
    },
    async token(parent: Bot): Promise<string> {
      return (await parent.discordDetails).token;
    }
  }
};

export default botResolvers;
