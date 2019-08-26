import {EntityRepository, getCustomRepository, Repository} from 'typeorm';
import {ScriptLink} from '../entities/ScriptLink';
import User from '../entities/User';

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
    link.addedBy = user.id;
    return await this.save(link);
  }
}

const getScriptLinkRepo = () => getCustomRepository(ScriptLinkRepo);
export default getScriptLinkRepo;
