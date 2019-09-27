import {GraphContext, Paginated} from '../typeDefs';
import {Platform} from '../../entities/Bot';
import {Script} from '../../entities/Script';
import getScriptRepo from '../../repos/ScriptRepo';
import User from '../../entities/User';
import getUserRepo from '../../repos/UserRepo';

const newScriptName = 'untitled-script';

interface ScriptCreateInput {
  name: string;
  body: string;
  platform?: Platform;
}
interface ScriptUpdateInput {
  id: string;
  name?: string;
  body?: string;
  platform?: Platform;
}

const scriptResolvers = {
  Query: {
    async script(parent: void, args: {id: string}, context: GraphContext): Promise<Script | null> {
      return await getScriptRepo().findOne({resourceOwnerId: context.user.id, id: args.id}) || null;
    },
    async scripts(parent: void, args: void, context: GraphContext): Promise<Paginated<Script>> {
      const scripts = await getScriptRepo().find({resourceOwnerId: context.user.id});
      return {
        nodes: scripts,
        totalCount: scripts.length
      };
    }
  },
  Mutation: {
    async createScript(parent: void, args: {script?: ScriptCreateInput}, context: GraphContext): Promise<Script> {
      // Find next available untitled-script-* slot
      const scriptRepo = getScriptRepo();
      if (!args.script) {
        const matchingScripts = await scriptRepo.createQueryBuilder('script')
          .where('script.name LIKE :name', {name: newScriptName + '%'})
          .getMany();
        let nextName = newScriptName;
        if (matchingScripts.length) {
          // Find the maximum number
          // Convert names to the number contained at the end
          const nums = matchingScripts.map((s) => parseInt(s.name.substr(newScriptName.length + 1), 10) || 0);
          nextName += '-' + (Math.max(...nums) + 1);
        }
        return await scriptRepo.createAndSave({
          name: nextName,
          body: '',
          platform: 'NODEJS',
          owner: context.user
        });
      } else {
        return scriptRepo.createAndSave({
          name: args.script.name,
          body: args.script.body,
          platform: args.script.platform || 'NODEJS',
          owner: context.user
        });
      }
    },
    async updateScript(parent: void, args: {script: ScriptUpdateInput}, context: GraphContext): Promise<Script> {
      const scriptRepo = getScriptRepo();
      const script = await scriptRepo.findOneIfUserCanRead(args.script.id, context.user);
      if (!script) throw new Error('Not found');

      if (args.script.name) script.name = args.script.name;
      if (args.script.platform) script.platform = args.script.platform;
      if (args.script.body) script.body = args.script.body;
      return await scriptRepo.save(script);
    },
    async deleteScript(parent: void, {script: scriptId}: {script: string}, context: GraphContext): Promise<string> {
      const scriptRepo = getScriptRepo();
      const script = await scriptRepo.findOneIfUserCanRead(scriptId, context.user);
      if (!script) throw new Error('Not found');

      await scriptRepo.remove(script);
      return scriptId;
    }
  },
  Script: {
    // id can default
    // name can default
    // body can default
    // platform can probably default
    async resourceOwner(parent: Script): Promise<User> {
      // Casting *should* be safe, because if the resource_owner doesn't exist, the resource will have been deleted
      return await getUserRepo().findOne({id: parent.resourceOwnerId}) as User;
    },
    // created can default
    async createdBy(parent: Script): Promise<User | null> {
      if (!parent.createdById) return null;
      return await getUserRepo().findOne({id: parent.createdById}) || null;
    },
    // updated can default
    async updatedBy(parent: Script): Promise<User | null> {
      if (!parent.updatedById) return null;
      return await getUserRepo().findOne({id: parent.updatedById}) || null;
    }
  }
};

export default scriptResolvers;
