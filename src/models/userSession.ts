import * as UserDb from '../db/user';

interface UserSessionRevokeData {
  id: string;
  token?: string;
  user: string;
}
export async function revokeUserSession(data: UserSessionRevokeData): Promise<string> {
  if (data.user !== data.id) throw new Error(`...How's that even useful? Go away!`);
  if (data.token) await UserDb.revokeUserSession(data.id, data.token);
  else await UserDb.revokeAllUserSessions(data.id);
  return data.id;
}
