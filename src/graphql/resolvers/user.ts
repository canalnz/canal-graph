import {GraphContext} from '../typeDefs';
import {buildAvatarUrl} from '@canalapp/shared/dist/util/discord';
import {getAuthMethodRepo, getSessRepo, getUserFlagRepo, getUserRepo, User} from '@canalapp/shared/dist/db';
import {createInviteKey} from '../../lib/invite';

const resolvers = {
  Query: {
    user(parent: void, args: void, context: GraphContext): User {
      return context.user;
    },
    async users(parent: void, args: void, context: GraphContext): Promise<User[] | null> {
      if (getUserFlagRepo().isUserAdmin(context.user)) {
        return getUserRepo().find();
      } else return null;
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
    },
    async deleteUser(parent: void, args: {user?: string}, context: GraphContext): Promise<string> {
      const user = args.user || context.user.id;
      if (user !== context.user.id && !await getUserFlagRepo().isUserAdmin(user)) {
        throw new Error('You aren\'t permitted to delete other users!');
      }
      await getUserRepo().delete({id: user});
      return user;
    },
    async setUserFlag(parent: void, args: {user: string, name: string, value?: string}, context: GraphContext): Promise<string | null> {
      const flagRepo = getUserFlagRepo();
      if (!await flagRepo.isUserAdmin(context.user)) throw new Error('You aren\'t permitted to use this mutation');
      if (args.value) {
        const existing = await getUserFlagRepo().findOne({userId: args.user, name: args.name});
        if (existing) {
          existing.value = args.value;
          await flagRepo.save(existing);
        } else {
          await flagRepo.createAndSave(args);
        }
      } else {
        await getUserFlagRepo().delete({userId: args.user, name: args.name});
      }
      return args.value;
    },
    async createInviteKey(parent: void, args: {lifespan?: number}, context: GraphContext): Promise<string> {
      if (!await getUserFlagRepo().isUserAdmin(context.user)) throw new Error('You aren\'t permitted to use this mutation');

      return await createInviteKey(args.lifespan);
    }
  },
  User: {
    async admin(parent: User, args: void, context: GraphContext): Promise<boolean> {
      return await getUserFlagRepo().isUserAdmin(parent.id);
    },
    async avatarUrl(parent: User): Promise<string> {
      // TODO fix this fucking disaster
      const discordAuth = await getAuthMethodRepo().findOneOrFail({userId: parent.id, provider: 'DISCORD'});
      return buildAvatarUrl(discordAuth.providerId as string, parent.avatarHash as string);
    },
  },
  ClientUser: {
    async avatarUrl(parent: User): Promise<string> {
      // TODO fix this fucking disaster
      const discordAuth = await getAuthMethodRepo().findOneOrFail({userId: parent.id, provider: 'DISCORD'});
      return buildAvatarUrl(discordAuth.providerId as string, parent.avatarHash as string);
    },
    async admin(parent: User, args: void, context: GraphContext): Promise<boolean> {
      return await getUserFlagRepo().isUserAdmin(context.user);
    }
  }
};

export default resolvers;
