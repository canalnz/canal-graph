import {
  Bot, BotCreateInput, BotUpdateInput,
  createBot, deleteBot,
  getBot, getBotsForUser, updateBot
} from '../../models/bot';
import {
  BotPermission, BotPermissionCreateInput, BotPermissionUpdateInput,
  getBotPermissions, createBotPermission, updateBotPermission, deleteBotPermission
} from '../../models/botPermission';
import {GraphContext, Paginated} from '../typeDefs';
import {getUser, User} from '../../models/user';
import {getScriptLink, getScriptLinksForBot, ScriptLink} from '../../models/scriptLink';
import {buildAvatarUrl} from '../../lib/discord';

const botResolvers = {
  Query: {
    bot(parent: void, args: { id: string }, context: GraphContext): Promise<Bot | null> {
      return getBot({
        id: args.id,
        user: context.user.id
      });
    },
    async bots(parent: void, args: void, context: GraphContext): Promise<Paginated<Bot>> {
      const bots = await getBotsForUser(context.user.id);
      return {
        nodes: bots,
        totalCount: bots.length
      };
    }
  },
  Mutation: {
    async createBot(parent: void, {bot}: {bot: BotCreateInput}, context: GraphContext): Promise<Bot> {
      return createBot({
        ...bot,
        user: context.user.id
      });
    },
    async updateBot(parent: void, {bot}: {bot: BotUpdateInput}, context: GraphContext): Promise<Bot> {
      return updateBot({
        ...bot,
        user: context.user.id
      });
    },
    async deleteBot(parent: void, args: {id: string}, context: GraphContext): Promise<string> {
      return deleteBot({
        id: args.id,
        user: context.user.id
      });
    },

    async createBotPermission(parent: void, args: {perm: BotPermissionCreateInput}, context: GraphContext): Promise<BotPermission> {
      return createBotPermission({
        ...args.perm,
        user: context.user.id
      });
    },
    async updateBotPermission(parent: void, args: {perm: BotPermissionUpdateInput}, context: GraphContext): Promise<BotPermission> {
      return updateBotPermission({
        ...args.perm,
        user: context.user.id
      });
    },
    async deleteBotPermission(parent: void, args: {perm: string}, context: GraphContext): Promise<string> {
      return deleteBotPermission({
        id: args.perm,
        user: context.user.id
      });
    }
  },
  Bot: {
    // id can default
    // name can default
    // platform can default
    resourceOwner(parent: Bot): Promise<User> {
      return getUser(parent.resource_owner) as Promise<User>;
    },
    apiKey(parent: Bot): string {
      return parent.api_key;
    },
    avatarUrl(parent: Bot): string {
      return buildAvatarUrl(parent.discord_id, parent.avatar_hash);
    },
    // created can default
    createdBy(parent: Bot): Promise<User | null> {
      // Just being lazy and using the resource owner as creator
      return getUser(parent.resource_owner) as Promise<User>;
    },
    connection(parent: Bot) {
      // Ooooh this is where things get fun
      // TODO get fun
    },
    async scripts(parent: Bot, args: void, context: GraphContext): Promise<Paginated<ScriptLink>> {
      const scripts = await getScriptLinksForBot({
        bot: parent.id,
        user: context.user.id
      });
      return {
        nodes: scripts,
        totalCount: scripts.length
      };
    },
    script(parent: Bot, args: {id: string}, context: GraphContext): Promise<ScriptLink | null> {
      return getScriptLink({
        bot: parent.id,
        script: args.id,
        user: context.user.id
      });
    },
    permissions(parent: Bot, args: void, context: GraphContext): Promise<BotPermission[]> {
      return getBotPermissions({
        bot: parent.id,
        user: context.user.id
      });
    }
    // options can default?
  },
  // BotPermission can all default
  // BotPermissionQualifier can default too
};

export default botResolvers;
