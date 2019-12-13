import {GraphContext} from '../typeDefs';
import {
  Bot,
  getBotRepo,
  getModuleLinkRepo, getModuleRepo, getModuleStateRepo, getUserRepo, Module,
  ModuleLink, ModuleStateName, User
} from '@canalapp/shared/dist/db';

export interface LinkId {
  module: string;
  bot: string;
}

const moduleLinkResolvers = {
  Query: {},
  Mutation: {
    async linkModuleToBot(parent: void, args: LinkId, context: GraphContext): Promise<ModuleLink> {
      const linkRepo = getModuleLinkRepo();
      const existingLink = await linkRepo.findOne({botId: args.bot, moduleId: args.module});
      if (existingLink) throw new Error('That module is already added to that bot!');
      return await linkRepo.createAndSave({
        module: args.module,
        bot: args.bot,
        user: context.user
      });
    },
    async removeModuleFromBot(parent: void, args: LinkId, context: GraphContext): Promise<string> {
      // Validate bot's existence and perms
      const bot = await getBotRepo().findOneIfUserCanRead(args.bot, context.user);
      if (!bot) throw new Error('Bot not found');

      const linkRepo = getModuleLinkRepo();
      const link = await linkRepo.findOne({moduleId: args.module, botId: args.bot});
      if (!link) throw new Error('Link not found');

      await linkRepo.remove(link);

      return args.module;
    }
  },
  ModuleLink: {
    async module(parent: ModuleLink, args: void, context: GraphContext): Promise<Module | null> {
      // TODO Think about perms here, should the user be able to read module even if they don't have access?
      return await getModuleRepo().findOne({id: parent.moduleId}) || null;
    },
    async bot(parent: ModuleLink, args: void, context: GraphContext): Promise<Bot> {
      // TODO Think about perms here, should the user be able to read bot even if they don't have access?
      const bot = await getBotRepo().findOneIfUserCanRead(parent.botId, context.user);
      if (!bot) throw new Error('Internal error');
      return bot;
    },
    async state(parent: ModuleLink): Promise<ModuleStateName | null> {
      const state = await getModuleStateRepo().findOne({moduleId: parent.moduleId, botId: parent.botId});
      return state ? state.state : null;
    },
    // created can default
    async createdBy(parent: ModuleLink): Promise<User | null> {
      if (!parent.createdById) return null;
      return await getUserRepo().findOne({id: parent.createdById}) || null;
    }
  },
};

export default moduleLinkResolvers;
