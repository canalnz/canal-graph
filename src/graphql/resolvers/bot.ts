import {GraphContext, Paginated} from '../typeDefs';
import {buildAvatarUrl} from '@canalapp/shared/dist/util/discord';
import {
  Bot,
  BotPermission, BotPermissionQualifierType, BotState,
  getBotPermRepo,
  getBotRepo, getBotStateRepo,
  getScriptLinkRepo, getScriptStateRepo,
  getUserRepo,
  Platform, ScriptLink, ScriptStateName,
  User
} from '@canalapp/shared/dist/db';

export interface BotCreateInput {
  platform: Platform;
  token: string;
}
export interface BotUpdateInput {
  id: string;
  platform?: Platform;
}

export interface BotPermissionCreateInput {
  name: string;
  bot: string;
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
    async updateBot(parent: void, {bot: {id, platform}}: {bot: BotUpdateInput}, context: GraphContext): Promise<Bot> {
      const botRepo = getBotRepo();
      const bot = await botRepo.findOneIfUserCanRead(id, context.user);
      if (!bot) throw new Error('Couldn\'t find that bot :(');
      if (!platform) return bot; // idk why this would happen but 🤷‍

      bot.platform = platform;
      return await botRepo.save(bot);
    },
    async deleteBot(parent: void, args: {id: string}, context: GraphContext): Promise<string> {
      const botRepo = getBotRepo();
      const bot = await botRepo.findOneIfUserCanRead(args.id, context.user);
      if (!bot) throw new Error('Couldn\'t find that bot :(');
      await botRepo.remove(bot);
      return args.id;
    },

    async createBotPermission(parent: void, args: {perm: BotPermissionCreateInput}, context: GraphContext): Promise<BotPermission> {
      const bot = await getBotRepo().findOneIfUserCanRead(args.perm.bot, context.user);
      if (!bot) throw new Error('404 bot not found?');

      return getBotPermRepo().createAndSave({
        bot,
        name: args.perm.name
      });
    },
    async updateBotPermission(parent: void, args: {perm: BotPermissionUpdateInput}, context: GraphContext): Promise<BotPermission> {
      // this is a nightmare function. procrastination time!
      // TODO implement updateBotPermission
      throw new Error('Not implemented yet!');
    },
    async deleteBotPermission(parent: void, args: {perm: string}, context: GraphContext): Promise<string> {
      const permRepo = getBotPermRepo();
      const perm = await permRepo.findOne({id: args.perm});
      if (!perm) throw new Error('That perm couldn\'t be found');
      // check perms for perm
      const bot = await getBotRepo().findOneIfUserCanRead(perm.botId, context.user);
      if (!bot) throw new Error('That perm couldn\'t be found');

      await permRepo.remove(perm);
      return perm.id;
    }
  },
  Bot: {
    // id can default
    // name can default
    // platform can default
    async resourceOwner(parent: Bot): Promise<User> {
      return await getUserRepo().findOneOrFail({id: parent.resourceOwnerId});
    },
    avatarUrl(parent: Bot): string {
      return buildAvatarUrl(parent.discordId, parent.avatarHash || undefined);
    },
    // created can default
    async createdBy(parent: Bot): Promise<User | null> {
      // Just being lazy and using the resource owner as creator
      return await getUserRepo().findOne({id: parent.resourceOwnerId}) || null;
    },
    async connection(parent: Bot): Promise<BotState | null> {
      const state = await getBotStateRepo().findOne({botId: parent.id});
      return state || null;
    },
    async scripts(parent: Bot, args: void, context: GraphContext): Promise<Paginated<ScriptLink>> {
      // We can go ahead and load these scripts, because only trusted people can load the root bot
      const scriptLinkRepo = getScriptLinkRepo();
      const scripts = await scriptLinkRepo.find({botId: parent.id});
      return {
        nodes: scripts,
        totalCount: scripts.length
      };
    },
    async script(parent: Bot, args: {id: string}, context: GraphContext): Promise<ScriptLink | null> {
      return await getScriptLinkRepo().findOne({botId: parent.id, scriptId: args.id}) || null;
    },
    async permissions(parent: Bot, args: void, context: GraphContext): Promise<BotPermission[]> {
      return await getBotPermRepo().find({botId: parent.id});
    }
    // options can default?
  },
  BotConnection: {
    // state can default
    created(parent: BotState): Date {
      return parent.updated;
    }
  }
  // BotPermission can all default
  // BotPermissionQualifier can default too
};

export default botResolvers;
