import {GraphContext} from '../typeDefs';
import {getSessRepo, getUserFlagRepo, getUserRepo, User} from '@canalapp/shared/dist/db';
import { ForbiddenError } from 'apollo-server';

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
    async destroyAllSessions(parent: void, args: {user?: string}, context: GraphContext): Promise<string> {
      if (!await getUserFlagRepo().isUserAdmin(context.user) && args.user !== context.user.id) {
        throw new ForbiddenError('You aren\'t permitted to destroy other user\'s sessions!');
      }

      const sessRepo = getSessRepo();
      const sesses = await sessRepo.find({userId: args.user || context.user.id});
      await sessRepo.remove(sesses);

      return args.user || context.user.id;
    },
    async deleteUser(parent: void, args: {user?: string}, context: GraphContext): Promise<string> {
      const user = args.user || context.user.id;
      if (user !== context.user.id && !await getUserFlagRepo().isUserAdmin(user)) {
        throw new Error('You aren\'t permitted to delete other users!');
      }
      await getUserRepo().delete({id: user});
      return user;
    },
  },
  User: {
    // id can default
    // name can default
    async admin(parent: User, args: void, context: GraphContext): Promise<boolean> {
      if (!await getUserFlagRepo().isUserAdmin(context.user.id)) {
        throw new Error('You aren\'t permitted to access this value');
      }
      return await getUserFlagRepo().isUserAdmin(parent.id);
    },
    async avatarUrl(parent: User): Promise<string> {
      return parent.getAvatarUrl();
    },
  },
  ClientUser: {
    // id can default
    // name can default
    async avatarUrl(parent: User): Promise<string> {
      return parent.getAvatarUrl();
    },
    // avatarHash can default
    // email can default
    // created can default
    async admin(parent: User, args: void, context: GraphContext): Promise<boolean> {
      return await getUserFlagRepo().isUserAdmin(context.user);
    }
  }
};

export default resolvers;
