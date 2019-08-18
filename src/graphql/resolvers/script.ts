import {
  createScript,
  getScript,
  getScriptsForUser,
  updateScript,
  deleteScript,
  Script, Platform
} from '../../models/script';
import {GraphContext, Paginated} from '../typeDefs';
import {getUser, User} from '../../models/user';

interface ScriptCreateInput {
  name: string;
  body: string;
  platform: Platform;
}
interface ScriptUpdateInput {
  id: string;
  name?: string;
  body?: string;
  platform?: Platform;
}

const scriptResolvers = {
  Query: {
    script(parent: void, args: {id: string}, context: GraphContext): Promise<Script | null> {
      return getScript({
        id: args.id,
        user: context.user.id
      });
    },
    async scripts(parent: void, args: void, context: GraphContext): Promise<Paginated<Script>> {
      const scripts = await getScriptsForUser(context.user.id);
      return {
        nodes: scripts,
        totalCount: scripts.length
      };
    }
  },
  Mutation: {
    async createScript(parent: void, args: {script: ScriptCreateInput}, context: GraphContext): Promise<Script> {
      const id = await createScript({
        owner: context.user.id,
        ...args.script
      });
      return await getScript({
        id,
        user: context.user.id
      }) as Script;
    },
    async updateScript(parent: void, args: {script: ScriptUpdateInput}, context: GraphContext): Promise<Script> {
      const id = await updateScript({
        user: context.user.id,
        ...args.script
      });
      return await getScript({
        id,
        user: context.user.id
      }) as Script;
    },
    async deleteScript(parent: void, args: {script: string}, context: GraphContext): Promise<string> {
      return deleteScript({
        id: args.script,
        user: context.user.id
      });
    }
  },
  Script: {
    // id can default
    // name can default
    // body can default
    // platform can probably default
    resourceOwner(parent: Script): Promise<User> {
      // Casting *should* be safe, because if the resource_owner doesn't exist, the resource will have been deleted
      return getUser(parent.resource_owner) as Promise<User>;
    },
    // created can default
    async createdBy(parent: Script): Promise<User | null> {
      return getUser(parent.created_by);
    },
    // updated can default
    async updatedBy(parent: Script): Promise<User | null> {
      return parent.updated_by ? await getUser(parent.updated_by) : null;
    }
  }
};

export default scriptResolvers;
