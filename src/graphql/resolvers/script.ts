import {GraphContext, Paginated} from '../typeDefs';
import {getScriptRepo, getUserRepo, Platform, Script, User} from '@canalapp/shared/dist/db';
import * as namor from 'namor';

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

// Match Alphanumeric with dashes, and is between 1 - 100 chars
// as long as it doesn't start with dash
// as long as it doesn't end with dash
const scriptNameRegexes = [/^[a-z0-9-]{1,100}$/, /^[^-]/, /[^-]$/];
function validateScriptName(name: string): boolean {
  return scriptNameRegexes.every((r) => r.test(name));
}

async function generateUniqueScriptNameForUser(user: User): Promise<string> {
  let tries = 0;
  while (tries++ < 10) {
    const name = namor.generate({words: 2, numbers: 0});
    if (await checkIfScriptNameIsUniqueForUser(name, user)) return name;
  }
  return Math.random().toString(36).substr(2); // Give up on a pretty ID, just make something boring
}
async function checkIfScriptNameIsUniqueForUser(name: string, user: User): Promise<boolean> {
  return await getScriptRepo().count({resourceOwnerId: user.id, name}) === 0;
}
async function coerceScriptNameForUser(user: User, name?: string): Promise<string> {
  if (name) {
    // TODO wtf
    // console.log(name, valid);
    if (!validateScriptName(name)) {
      throw new Error('Invalid script name');
    }
    if (!await checkIfScriptNameIsUniqueForUser(name, user)) {
      throw new Error('A script with that name already exists!');
    }
    return name;
  } else return await generateUniqueScriptNameForUser(user);
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
    // They don't really have to be unique, but we should enforce uniqueness anyway
    // TODO enforce unique names
    async createScript(parent: void, args: {script?: ScriptCreateInput}, context: GraphContext): Promise<Script> {
      const scriptRepo = getScriptRepo();
      if (!args.script) {
        const name = await generateUniqueScriptNameForUser(context.user);

        return await scriptRepo.createAndSave({
          name,
          body: '',
          platform: 'NODEJS',
          owner: context.user
        });
      } else {
        const name = await coerceScriptNameForUser(context.user, args.script.name);

        return scriptRepo.createAndSave({
          name,
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

      if (args.script.name) {
        script.name = await coerceScriptNameForUser(context.user, args.script.name);
      }
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
