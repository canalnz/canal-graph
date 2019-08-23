import {EntityRepository, getCustomRepository, Repository} from 'typeorm';
import UserSession from '../entities/UserSession';
import User from '../entities/User';
import {AuthProvider} from '../entities/UserAuthMethod';
import * as crypto from 'crypto';

export interface NewSessionData {
  user: User;
  expires?: Date;
  authMethod: AuthProvider;
  creatorIp?: string;
  creatorUa?: string;
}

@EntityRepository(UserSession)
export class UserSessionRepository extends Repository<UserSession> {
  public createAndSave({user, expires, authMethod, creatorIp, creatorUa}: NewSessionData): Promise<UserSession> {
    const sess = new UserSession();
    sess.userId = user.id;
    sess.token = crypto.randomBytes(32).toString('hex');
    sess.expires = expires || new Date(new Date().setDate(new Date().getDate() + 7));
    sess.authMethod = authMethod;
    sess.creatorIp = creatorIp || null; // undefined -> null
    sess.creatorUa = creatorUa || null;

    return this.save(sess);
  }
}

const getSessRepo = () => getCustomRepository(UserSessionRepository);
export default getSessRepo;
