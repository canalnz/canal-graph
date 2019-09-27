import {EntityRepository, getCustomRepository, Repository} from 'typeorm';
import {ScriptLink} from '../entities/ScriptLink';
import User from '../entities/User';
import {gateway} from '../gateway/connector';
import {ScriptRepository} from './ScriptRepo';

export interface CreateScriptLinkData {
  script: string;
  bot: string;
  user: User;
}

@EntityRepository(ScriptLink)
export class ScriptLinkRepo extends Repository<ScriptLink> {
  public async createAndSave({script, bot, user}: CreateScriptLinkData): Promise<ScriptLink> {
    const link = new ScriptLink();
    link.scriptId = script;
    link.botId = bot;
    link.createdById = user.id;
    const entity = await this.save(link);
    this.propagateCreate(entity);
    return entity;
  }
  public restart(link: ScriptLink) {
    // Send a blank Update frame to restart it
    gateway.send(link.botId, 'SCRIPT_UPDATE', {id: link.scriptId});
  }
  public remove(entities: ScriptLink[]): Promise<ScriptLink[]>;
  public remove(entity: ScriptLink): Promise<ScriptLink>;
  public async remove(entities: ScriptLink | ScriptLink[]): Promise<ScriptLink | ScriptLink[]> {
    entities = Array.isArray(entities) ? entities : [entities]; // Coerce into array
    await Promise.all(entities.map(async (link) => {
      await this.propagateRemove(link);
    }));
    return super.remove(entities);
  }

  private async propagateCreate(link: ScriptLink) {
    const script = await getCustomRepository(ScriptRepository).findOneOrFail({
      id: link.scriptId
    });
    gateway.send(link.botId, 'SCRIPT_CREATE', {
      id: link.scriptId,
      name: script.name,
      body: script.body,
      platform: script.platform
    });
  }
  private async propagateRemove(link: ScriptLink) {
    // Send a blank Update frame to restart it
    gateway.send(link.botId, 'SCRIPT_REMOVE', {id: link.scriptId});
  }
}

const getScriptLinkRepo = () => getCustomRepository(ScriptLinkRepo);
export default getScriptLinkRepo;
