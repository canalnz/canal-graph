import {GraphContext} from '../typeDefs';
import {buildAvatarUrl} from '../../lib/discord';
import User from '../../entities/User';
import getSessRepo from '../../repos/UserSessionRepo';
import getAuthMethodRepo from '../../repos/UserAuthMethodRepo';

const resolvers = {
  Query: {
    user(parent: void, args: void, context: GraphContext): User {
      return context.user;
    }
  },
  Mutation: {
    async destroySession(parent: void, args: void, context: GraphContext) {
      const sessRepo = getSessRepo();
      const sess = await sessRepo.findOne({userId: context.user.id, token: context.token});
      if (!sess) throw new Error('Internal Error');
      await sessRepo.remove(sess);

      return context.user.id;
    },
    async destroyAllSessions(parent: void, args: void, context: GraphContext): Promise<string> {
      const sessRepo = getSessRepo();
      const sesses = await sessRepo.find({userId: context.user.id});
      await sessRepo.remove(sesses);

      return context.user.id;
    }
  },
  ClientUser: {
    async avatarUrl(parent: User): Promise<string> {
      // TODO fix this fucking disaster
      const discordAuth = await getAuthMethodRepo().findOne({userId: parent.id, provider: 'DISCORD'});
      if (!discordAuth) throw new Error('No idea what went wrong here');
      return buildAvatarUrl(discordAuth.providerId as string, parent.avatarHash as string);
    }
  }
};

export default resolvers;
