import * as http from 'http';
import {getUserForSession, User} from '../db';

export async function authenticateHttpRequest(req: http.IncomingMessage):
  Promise<{user: User | null, token: string} | null> {
  const token = req.headers.authorization;
  if (!token) return null;
  return {
    user: await getUserForSession(token) || null,
    token
  };
}
