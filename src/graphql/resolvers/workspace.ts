import {Bot, getModuleRepo, getUserRepo, getWorkspaceRepo, Module, User, Workspace} from '@canalapp/shared/dist/db';
import {GraphContext} from '../typeDefs';

export interface CreateWorkspaceInput {
  name: string;
}

export interface UpdateWorkspaceInput {
  id: string;
  name?: string;
}

export const workspaceResolvers = {
  Query: {
    async workspaces(parent: void, args: void, context: GraphContext): Promise<Workspace[]> {
      return await getWorkspaceRepo().find({resourceOwnerId: context.user.id});
    },
    async workspace(parent: void, args: {id: string}, context: GraphContext): Promise<Workspace | null> {
      return await getWorkspaceRepo().findOneIfUserCanRead(args.id, context.user);
    }
  },
  Mutation: {
    async createWorkspace(parent: void, args: CreateWorkspaceInput, context: GraphContext): Promise<Workspace> {
      return await getWorkspaceRepo().createAndSave({
        name: args.name,
        user: context.user,
        personal: false
      });
    },
    async updateWorkspace(parent: void, args: UpdateWorkspaceInput, context: GraphContext): Promise<Workspace> {
      const workspaceRepo = getWorkspaceRepo();
      const workspace = await workspaceRepo.findOneIfUserCanRead(args.id, context.user);
      if (!workspace) throw new Error('Couldn\'t find that workspace');

      if (args.name) workspace.name = args.name;

      await workspaceRepo.save(workspace);
      return workspace;
    },
    async removeWorkspace(parent: void, args: {id: string}, context: GraphContext): Promise<string> {
      const workspaceRepo = getWorkspaceRepo();
      const workspace = await workspaceRepo.findOneIfUserCanRead(args.id, context.user);
      if (!workspace) {
        throw new Error('Couldn\'t find that workspace');
      }

      await workspaceRepo.remove(workspace);
      return workspace.id;
    }
  },
  Workspace: {
    // id can default
    // name can default
    async resourceOwner(parent: Bot): Promise<User> {
      return await getUserRepo().findOneOrFail({id: parent.resourceOwnerId});
    },
    // isPersonal can default
    async users() {
      // TODO users
    },
    async modules(parent: Workspace, args: void, context: GraphContext): Promise<Module[]> {
      return await getModuleRepo().find({workspaceId: parent.id});
    }
  }
};
