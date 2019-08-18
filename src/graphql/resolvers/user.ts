import {User} from '../../models/user';
import {revokeUserSession} from '../../models/userSession';
import {GraphContext} from '../typeDefs';

const resolvers = {
  Query: {
    user(parent: void, args: void, context: GraphContext): User {
      return context.user;
    }
  },
  Mutation: {
    async destroySession(parent: void, args: void, context: GraphContext) {
      await revokeUserSession({
        id: context.user.id,
        token: context.token,
        user: context.user.id
      });
      return context.user.id;
    },
    async destroyAllSessions(parent: void, args: void, context: GraphContext): Promise<string> {
      await revokeUserSession({
        id: context.user.id,
        user: context.user.id
      });
      return context.user.id;
    }
  },
  ClientUser: {
    avatarUrl(parent: User) {
      if (!parent.avatar_url) console.warn(`User ${parent.id} doesn't have an avatar`);
      return parent.avatar_url ||
        '//cdn.discordapp.com/avatars/269783357297131521/80c311e9817186aa764c53bd0800edba.png?size=256';
    }
  }
};

export default resolvers;
