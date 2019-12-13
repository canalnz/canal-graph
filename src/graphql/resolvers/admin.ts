import {GraphContext} from '../typeDefs';
import {getUserFlagRepo, getUserRepo, User} from '@canalapp/shared/dist/db';
import {ForbiddenError} from 'apollo-server-express';
import {createInviteKey} from '../../lib/invite';

export const adminResolvers = {
  Query: {
    async users(parent: void, args: void, context: GraphContext): Promise<User[] | null> {
      if (await getUserFlagRepo().isUserAdmin(context.user)) {
        return getUserRepo().find();
      } else {
        return null;
      }
    }
  },
  Mutation: {
    async setUserFlag(parent: void, args: { user: string, name: string, value?: boolean }, context: GraphContext): Promise<boolean> {
      const flagRepo = getUserFlagRepo();
      if (!await flagRepo.isUserAdmin(context.user)) throw new Error('You aren\'t permitted to use this mutation');
      if (args.value) {
        const existing = await getUserFlagRepo().findOne({userId: args.user, name: args.name});
        if (existing) {
          existing.value = 'true';
          await flagRepo.save(existing);
        } else {
          await flagRepo.createAndSave({...args, value: 'true'});
        }
      } else {
        await getUserFlagRepo().delete({userId: args.user, name: args.name});
      }
      return args.value;
    },
    async createInviteKey(parent: void, args: { lifespan?: number }, context: GraphContext): Promise<string> {
      if (!await getUserFlagRepo().isUserAdmin(context.user)) throw new ForbiddenError('Forbidden');
      return await createInviteKey(Date.now() + args.lifespan);
    }
  }
};
