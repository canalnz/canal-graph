import {EntityRepository, getCustomRepository, Repository} from 'typeorm';
import UserAuthMethod, {AuthProvider} from '../entities/UserAuthMethod';
import User from '../entities/User';

export interface NewAuthMethodData {
  user: User;
  provider: AuthProvider;
  providerId: string;
  expires: Date;
  refreshToken: string;
  accessToken: string;
}

@EntityRepository(UserAuthMethod)
export class UserAuthMethodRepository extends Repository<UserAuthMethod> {
  public async createAndSave({ user, provider, providerId, expires, refreshToken, accessToken }: NewAuthMethodData):
    Promise<UserAuthMethod> {
    const method = new UserAuthMethod();
    method.userId = user.id;
    method.provider = provider;
    method.providerId = providerId;
    method.expires = expires;
    method.refreshToken = refreshToken;
    method.accessToken = accessToken;
    return this.save(method);
  }
}

const getAuthMethodRepo = () => getCustomRepository(UserAuthMethodRepository);
export default getAuthMethodRepo;
