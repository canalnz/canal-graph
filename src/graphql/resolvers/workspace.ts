import {Bot, getModuleRepo, getUserRepo, getWorkspaceRepo, Module, User, Workspace} from '@canalapp/shared/dist/db';
import {GraphContext, Paginated} from '../typeDefs';

export interface CreateWorkspaceInput {
  name: string;
}

export interface UpdateWorkspaceInput {
  id: string;
  name?: string;
}

export const workspaceResolvers = {
  Query: {
    async workspaces(parent: void, args: void, context: GraphContext): Promise<Paginated<Workspace>> {
      const workspaces = await getWorkspaceRepo().find({resourceOwnerId: context.user.id});
      return {
        totalCount: workspaces.length,
        nodes: workspaces
      };
    },
    async workspace(parent: void, args: {id: string}, context: GraphContext): Promise<Workspace | null> {
      if (!args.id) throw new Error('No id provided');

      return await getWorkspaceRepo().findOneIfUserCanRead(args.id, context.user);
    }
  },
  Mutation: {
    async createWorkspace(parent: void, args: {workspace: CreateWorkspaceInput}, context: GraphContext): Promise<Workspace> {
      return await getWorkspaceRepo().createAndSave({
        name: args.workspace.name,
        user: context.user,
        personal: false
      });
    },
    async updateWorkspace(parent: void, args: {workspace: UpdateWorkspaceInput}, context: GraphContext): Promise<Workspace> {
      const workspaceRepo = getWorkspaceRepo();
      const workspace = await workspaceRepo.findOneIfUserCanRead(args.workspace.id, context.user);
      if (!workspace) throw new Error('Couldn\'t find that workspace');

      if (args.workspace.name) workspace.name = args.workspace.name;

      await workspaceRepo.save(workspace);
      return workspace;
    },
    async removeWorkspace(parent: void, args: {id: string}, context: GraphContext): Promise<string> {
      const workspaceRepo = getWorkspaceRepo();
      const workspace = await workspaceRepo.findOneIfUserCanRead(args.id, context.user);
      if (!workspace) {
        throw new Error('Couldn\'t find that workspace');
      }
      if (workspace.isPersonal) {
        throw new Error('You can\'t delete your personal workspace!');
      }

      await workspaceRepo.remove(workspace);
      return args.id;
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
    async modules(parent: Workspace, args: void, context: GraphContext): Promise<Paginated<Module>> {
      const modules = await getModuleRepo().find({workspaceId: parent.id});
      return {
        totalCount: modules.length,
        nodes: modules
      };
    }
  }
};
