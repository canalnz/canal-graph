import * as http from 'http';
import {User, getUserRepo} from '@canalapp/shared';

export async function authenticateHttpRequest(req: http.IncomingMessage):
  Promise<{user: User | null, token: string} | null> {
  const token = req.headers.authorization;
  if (!token) return null;
  return {
    user: await getUserRepo().getByToken(token) || null,
    token
  };
}
