import {GraphContext} from '../typeDefs';
import {ScriptLink, Script, ScriptState, Bot, User,
  getScriptLinkRepo, getBotRepo, getScriptRepo, getUserRepo} from '@canalapp/shared/dist/db';

export interface LinkId {
  script: string;
  bot: string;
}

const scriptLinkResolvers = {
  Query: {},
  Mutation: {
    async addScriptToBot(parent: void, args: LinkId, context: GraphContext): Promise<ScriptLink> {
      const linkRepo = getScriptLinkRepo();
      const existingLink = await linkRepo.findOne({botId: args.bot, scriptId: args.script});
      if (existingLink) throw new Error('That script is already added to that bot!');
      return await linkRepo.createAndSave({
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

      return args.script;
    },
    async restartScriptOnBot(parent: void, args: LinkId, context: GraphContext): Promise<ScriptLink> {
      // Validate bot's existence and perms
      const bot = await getBotRepo().findOneIfUserCanRead(args.bot, context.user);
      if (!bot) throw new Error('Bot not found');

      const linkRepo = getScriptLinkRepo();
      const link = await linkRepo.findOne({scriptId: args.script, botId: args.bot});
      if (!link) throw new Error('Link not found');

      await linkRepo.restart(link);
      return link;
    },
    async restartScriptEverywhere(parent: void, args: {script: string}, context: GraphContext): Promise<ScriptLink[]> {
      const linkRepo = getScriptLinkRepo();
      const links = await linkRepo.find({scriptId: args.script});

      const script = await getScriptRepo().findOneIfUserCanRead(args.script, context.user);
      if (!script) throw new Error('Script not found!');

      await Promise.all(links.map(async (link) => {
        await linkRepo.restart(link);
      }));

      return links;
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
      if (!parent.createdById) return null;
      return await getUserRepo().findOne({id: parent.createdById}) || null;
    }
  },
};

export default scriptLinkResolvers;
