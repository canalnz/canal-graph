import * as namor from 'namor';
import {GraphContext, Paginated} from '../typeDefs';
import {getModuleRepo, getUserRepo, getWorkspaceRepo, Module, User, Workspace} from '@canalapp/shared/dist/db';
import {Platform, Runtime} from '@canalapp/shared/dist/constants';

interface ModuleCreateInput {
  name?: string;
  body?: string;
  runtime: Runtime;
  workspace: string;
}
interface ModuleUpdateInput {
  id: string;
  name?: string;
  body?: string;
  deployedBody?: string;
  runtime?: Runtime;
}

// Match Alphanumeric with dashes, and is between 1 - 100 chars
// as long as it doesn't start with dash
// as long as it doesn't end with dash
const moduleNameRegexes = [/^[a-z0-9-]{1,100}$/, /^[^-]/, /[^-]$/];
function validateModuleName(name: string): boolean {
  return moduleNameRegexes.every((r) => r.test(name));
}

async function generateUniqueModuleNameForWorkspace(workspace: Workspace): Promise<string> {
  let tries = 0;
  while (tries++ < 10) {
    const name = namor.generate({words: 2, numbers: 0});
    if (await checkIfModuleNameIsUniqueForWorkspace(name, workspace)) return name;
  }
  return Math.random().toString(36).substr(2); // Give up on a pretty ID, just make something boring
}
async function checkIfModuleNameIsUniqueForWorkspace(name: string, workspace: Workspace): Promise<boolean> {
  return await getModuleRepo().count({workspaceId: workspace.id, name}) === 0;
}
async function coerceModuleNameForWorkspace(workspace: Workspace, name?: string): Promise<string> {
  if (name) {
    if (!validateModuleName(name)) {
      throw new Error('Invalid module name');
    }
    if (!await checkIfModuleNameIsUniqueForWorkspace(name, workspace)) {
      throw new Error('A module with that name already exists!');
    }
    return name;
  } else return await generateUniqueModuleNameForWorkspace(workspace);
}

const moduleResolvers = {
  Query: {
    async module(parent: void, args: {id: string}, context: GraphContext): Promise<Module | null> {
      return await getModuleRepo().findOneIfUserCanRead(args.id, context.user) || null;
    },
    // async modules(parent: void, args: {workspace}, context: GraphContext): Promise<Paginated<Module>> {
    //   const scripts = await getModuleRepo().find({resourceOwnerId: context.user.id});
    //   return {
    //     nodes: scripts,
    //     totalCount: scripts.length
    //   };
    // }
  },
  Mutation: {
    // They don't really have to be unique, but we should enforce uniqueness anyway
    async createModule(parent: void, {module: moduleData}: {module: ModuleCreateInput}, context: GraphContext): Promise<Module> {
      const moduleRepo = getModuleRepo();
      const workspaceRepo = getWorkspaceRepo();
      const workspace = await workspaceRepo.findOneIfUserCanRead(moduleData.workspace, context.user);

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      let name;
      if (!moduleData.name) {
        name = await generateUniqueModuleNameForWorkspace(workspace);
      } else {
        name = await coerceModuleNameForWorkspace(workspace, moduleData.name);
      }

      return moduleRepo.createAndSave({
        name,
        body: moduleData.body || '',
        runtime: moduleData.runtime,
        workspace,
        user: context.user
      });
    },
    async updateModule(parent: void, {module: moduleData}: {module: ModuleUpdateInput}, context: GraphContext): Promise<Module> {
      const moduleRepo = getModuleRepo();
      const module = await moduleRepo.findOneIfUserCanRead(moduleData.id, context.user);
      if (!module) throw new Error('Not found');

      if (moduleData.name) module.name = await coerceModuleNameForWorkspace(await module.workspace, moduleData.name);
      if (moduleData.runtime) module.runtime = moduleData.runtime;
      if (moduleData.body) module.body = moduleData.body;
      if (moduleData.deployedBody) module.deployedBody = moduleData.deployedBody;

      return await moduleRepo.save(module);
    },
    async deleteModule(parent: void, {id}: {id: string}, context: GraphContext): Promise<string> {
      const moduleRepo = getModuleRepo();
      const module = await moduleRepo.findOneIfUserCanRead(id, context.user);
      if (!module) throw new Error('Not found');

      await moduleRepo.remove(module);
      return id;
    }
  },
  Module: {
    // id can default
    // name can default
    // body can default
    // deployedBody can default
    // runtime can probably default
    async workspace(parent: Module, args: void, context: GraphContext): Promise<Workspace | null> {
      return await getWorkspaceRepo().findOneIfUserCanRead(parent.workspaceId, context.user);
    },
    // created can default
    async createdBy(parent: Module): Promise<User | null> {
      if (!parent.createdById) return null;
      return await getUserRepo().findOne({id: parent.createdById}) || null;
    },
    // updated can default
    async updatedBy(parent: Module): Promise<User | null> {
      if (!parent.updatedById) return null;
      return await getUserRepo().findOne({id: parent.updatedById}) || null;
    }
  }
};

export default moduleResolvers;
