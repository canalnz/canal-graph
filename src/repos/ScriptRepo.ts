import {EntityRepository, getCustomRepository, Repository} from 'typeorm';
import {Script} from '../entities/Script';
import Bot, {Platform} from '../entities/Bot';
import User from '../entities/User';
import {nextSnowflake} from '../lib/snowflake';

interface ScriptCreateData {
  name: string;
  body: string;
  platform: Platform;
  owner: User;
}

@EntityRepository(Script)
export class ScriptRepository extends Repository<Script> {
  public async findOneIfUserCanRead(id: string, user: User): Promise<Script | null> {
    // It's only going to find it if it both exists *and* is owned by the user
    // Basically 404s rather than 403ing when perms aren't ok
    return await this.findOne({id, resourceOwner: user.id}) || null;
  }
  public async createAndSave({name, body, platform, owner}: ScriptCreateData) {
    const script = new Script();
    script.id = await nextSnowflake();
    script.name = name;
    script.body = body;
    script.platform = platform;
    script.resourceOwner = owner.id;
    script.createdBy = owner.id;
    return this.save(script);
  }
}

const getScriptRepo = () => getCustomRepository(ScriptRepository);
export default getScriptRepo;
