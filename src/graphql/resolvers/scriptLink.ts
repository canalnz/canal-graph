import {GraphContext} from '../typeDefs';
import {ScriptLink} from '../../entities/ScriptLink';
import {Script, ScriptState} from '../../entities/Script';
import Bot from '../../entities/Bot';
import getScriptLinkRepo from '../../repos/ScriptLinkRepo';
import getBotRepo from '../../repos/BotRepo';
import getScriptRepo from '../../repos/ScriptRepo';
import User from '../../entities/User';
import getUserRepo from '../../repos/UserRepo';

export interface LinkId {
  script: string;
  bot: string;
}

const scriptLinkResolvers = {
  Query: {},
  Mutation: {
    async addScriptToBot(parent: void, args: LinkId, context: GraphContext): Promise<ScriptLink> {
      return await getScriptLinkRepo().createAndSave({
        script: args.script,
        bot: args.bot,
        user: context.user
      });
    },
    async removeScriptFromBot(parent: void, args: LinkId, context: GraphContext): Promise<string> {
      // Validate bot's existence and perms
      const bot = await getBotRepo().findOneIfUserCanRead(args.bot, context.user);
      if (!bot) throw new Error('Bot not found');

      const linkRepo = getScriptLinkRepo();
      const link = await linkRepo.findOne({scriptId: args.script, botId: args.bot});
      if (!link) throw new Error('Link not found');

      await linkRepo.remove(link);
      return link.scriptId;
    },
    async restartScriptOnBot(parent: void, args: LinkId, context: GraphContext): Promise<ScriptLink> {
      // It should crash and burn if it doesn't exist anyway
      // TODO the restartey part of restarting
      // Validate bot's existence and perms
      const bot = await getBotRepo().findOneIfUserCanRead(args.bot, context.user);
      if (!bot) throw new Error('Bot not found');

      const linkRepo = getScriptLinkRepo();
      const link = await linkRepo.findOne({scriptId: args.script, botId: args.bot});
      if (!link) throw new Error('Link not found');

      return link;
    }
  },
  ScriptLink: {
    async script(parent: ScriptLink, args: void, context: GraphContext): Promise<Script | null> {
      // TODO Think about perms here, should the user be able to read script even if they don't have access?
      return await getScriptRepo().findOne({id: parent.scriptId}) || null;
    },
    async bot(parent: ScriptLink, args: void, context: GraphContext): Promise<Bot> {
      // TODO Think about perms here, should the user be able to read bot even if they don't have access?
      const bot = await getBotRepo().findOneIfUserCanRead(parent.botId, context.user);
      if (!bot) throw new Error('Internal error');
      return bot;
    },
    // lastStarted can default
    async state(parent: ScriptLink): Promise<ScriptState> {
      return 'ERRORED';
    },
    // created can default
    async createdBy(parent: ScriptLink): Promise<User | null> {
      if (!parent.createdBy) return null;
      return await getUserRepo().findOne({id: parent.createdBy}) || null;
    }
  },
};

export default scriptLinkResolvers;
