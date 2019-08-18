import {
  Bot,
  getBot,
} from '../../models/bot';
import {
  createScriptLink, deleteScriptLink, getScriptLink,
  ScriptLink, ScriptState
} from '../../models/scriptLink';
import {getScript, Script} from '../../models/script';
import {getUser, User} from '../../models/user';
import {GraphContext} from '../typeDefs';

const scriptLinkResolvers = {
  Query: {},
  Mutation: {
    addScriptToBot(parent: void, args: {script: string, bot: string}, context: GraphContext): Promise<ScriptLink> {
      return createScriptLink({
        script: args.script,
        bot: args.bot,
        user: context.user.id
      });
    },
    async removeScriptFromBot(parent: void, args: {script: string, bot: string}, context: GraphContext): Promise<string> {
      await deleteScriptLink({
        script: args.script,
        bot: args.bot,
        user: context.user.id
      });
      return args.script;
    },
    restartScriptOnBot(parent: void, args: {script: string, bot: string}, context: GraphContext): Promise<ScriptLink> {
      // It should crash and burn if it doesn't exist anyway
      // TODO the restartey part of restarting
      return getScriptLink({
        script: args.script,
        bot: args.bot,
        user: context.user.id
      }) as Promise<ScriptLink>;
    }
  },
  ScriptLink: {
    script(parent: ScriptLink, args: void, context: GraphContext): Promise<Script | null> {
      return getScript({
        id: parent.script,
        user: context.user.id
      });
    },
    bot(parent: ScriptLink, args: void, context: GraphContext): Promise<Bot> {
      return getBot({
        id: parent.bot,
        user: context.user.id
      }) as Promise<Bot>;
    },
    // lastStarted can default
    async state(parent: ScriptLink): Promise<ScriptState> {
      return 'ERRORED';
    },
    // added can default
    addedBy(parent: ScriptLink): Promise<User | null> {
      return getUser(parent.addedBy);
    }
  },
};

export default scriptLinkResolvers;
