import * as UserDb from '../db/user';
// tslint:disable-next-line:max-line-length
const DEFAULT_AVATAR_URL = '//cdn.discordapp.com/avatars/269783357297131521/80c311e9817186aa764c53bd0800edba.png?size=256';

export type User = UserDb.User;

export interface UserCreateData {
  name: string;
  email: string;
  avatarUrl?: string;
}
export async function createUser(data: UserCreateData): Promise<User> {
  data.avatarUrl = data.avatarUrl || DEFAULT_AVATAR_URL;
  return UserDb.createUser(data as UserCreateData & {avatarUrl: string}); // Eh, fuck it
}

export async function getUser(id: string): Promise<User | null> {
  return UserDb.getUser(id);
}

export type UserUpdateData = UserDb.UserUpdateData & {
  user: string;
};
export async function updateUser(data: UserUpdateData): Promise<string> {
  if (data.user !== data.id) throw new Error('Hey, that\'s not you! Bad user!');
  await UserDb.updateUser(data);
  return data.id;
}

interface UserDeleteData {
  id: string;
  user: string; // This is confusing, but refers to the authed user
}
export async function deleteUser({id, user}: UserDeleteData): Promise<string> {
  if (id !== user) throw new Error('Naughty, you can\'t delete other people');
  await UserDb.deleteUser(id);
  return id;
}
