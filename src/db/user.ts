import * as crypto from 'crypto';
import {db, deleteBot} from './index';
import {nextSnowflake} from '../lib/snowflake';

type OAuthProvider = 'PASSWORD' | 'DISCORD' | 'GOOGLE' | 'GITHUB';

export interface User {
  id: string;
  name: string;
  email: string;
  created: Date;
  avatar_url?: string;
  last_login?: Date;
}

/* Look through oauth_sessions for a user with a matching discord id */
export async function findUserIdByDiscordId(id: string): Promise<string | null> {
  const oauthLink = await db.oneOrNone('SELECT user_id FROM user_auth_methods WHERE ' +
    'provider = \'DISCORD\' AND provider_id = $1', id);
  return oauthLink ? oauthLink.user_id : null;
}

/* Checks if a user exists with an ID */
export async function doesUserExist(id: string): Promise<boolean> {
  return !!(await db.oneOrNone('SELECT id FROM users WHERE id = $1', id));
}
/* Gets a user */
export async function getUser(id: string): Promise<User | null> {
  return await db.oneOrNone('SELECT * FROM users WHERE id = $1', id);
}
/* Create a user */
export interface UserCreateData {
  name: string;
  email: string;
  avatarUrl: string;
}
export async function createUser({name, email, avatarUrl}: UserCreateData): Promise<User> {
  const user = {
    id: await nextSnowflake(),
    name, email,
    created: new Date(),
    avatarUrl
  };
  // id name email verified, avatar, created, last_login
  await db.none('INSERT INTO users (id, name, email, verified, created, avatar_url) ' +
    'VALUES (${id}, ${name}, ${email}, false, ${created}, ${avatarUrl});', user);
  return user;
}

export interface UserUpdateData {
  id: string;
  name?: string;
  email?: string;
}
export async function updateUser(data: UserUpdateData): Promise<string> {
  if (data.name) await db.none('UPDATE users SET name = ${name} WHERE id = ${id}', data);
  if (data.email) await db.none('UPDATE users SET email = ${email} WHERE id = ${id}', data);
  return data.id;
}
/* Deletes a user. Wow, this is a surprising amount of work */
export async function deleteUser(id: string): Promise<string> {
  await db.tx(async (t) => {
    const bots = await t.any('SELECT id FROM bots WHERE resource_owner = $1', id);
    return t.batch([
      t.none('DELETE FROM users WHERE id = $1', id),
      t.none('DELETE FROM user_sessions WHERE user_id = $1', id),
      t.none('DELETE FROM oauth_sessions WHERE user_id = $1', id),
      t.none('DELETE FROM scripts WHERE resource_owner = $1', id),
      ...bots.map((b) => deleteBot(b))
    ]);
  });
  return id;
}

/* Adds an oauth link to a user */
interface OAuthCreate {
  user_id: string;
  provider: OAuthProvider;
  provider_id: string; // User's id on the provider, i.e discord ID
  created?: Date;
  expires: Date;
  access_token: string;
  refresh_token: string;
}
interface OAuthData extends OAuthCreate {
  created: Date;
}
export async function createOAuthLink(input: OAuthCreate): Promise<OAuthData> {
  input.created = input.created || new Date();
  await db.none('INSERT INTO user_auth_methods ' +
    '(user_id, provider, provider_id, created, expires, refresh_token, access_token) ' +
    'VALUES ($1, $2, $3, $4, $5, $6, $7);', [
    input.user_id,
    input.provider,
    input.provider_id,
    input.created,
    input.expires,
    input.refresh_token,
    input.access_token
  ]);
  // We manually assign created above, so cast is safe
  return input as OAuthData;
}

/* Create a session */
interface UserSessionContext {
  auth_method: OAuthProvider;
  ip: string;
  ua: string;
}
interface UserSessionData {
  user_id: string;
  token: string;
  created: Date;
  expires: Date;
  auth_method: OAuthProvider;
  creator_ip: string;
  creator_ua: string;
}
export async function createUserSession(id: string, context: UserSessionContext): Promise<UserSessionData> {
  const token = crypto.randomBytes(32).toString('hex');
  const newSession = {
    user_id: id,
    token,
    created: new Date(),
    expires: new Date(new Date().setDate(new Date().getDate() + 7)),
    auth_method: context.auth_method,
    creator_ip: context.ip,
    creator_ua: context.ua
  } as UserSessionData;

  await db.none('UPDATE users SET last_login = $2 WHERE id = $1', [id, new Date()]);
  await db.none(`INSERT INTO user_sessions (user_id, token, created, expires, auth_method, creator_ip, creator_ua)
  VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
    newSession.user_id,
    newSession.token,
    newSession.created,
    newSession.expires,
    newSession.auth_method,
    newSession.creator_ip,
    newSession.creator_ua
  ]);

  return newSession;
}

export async function getUserForSession(token: string): Promise<User | null> {
  const idResp = await db.oneOrNone('SELECT user_id FROM user_sessions WHERE token = $1', [token]);
  if (!idResp || !idResp.user_id) return null;
  const user = await db.oneOrNone('SELECT * FROM users WHERE id = $1', idResp.user_id)
  if (!user) await handleMissingUser(idResp.user_id);
  return user;
}

export async function revokeUserSession(id: string, token: string): Promise<void> {
  await db.none('DELETE FROM user_sessions WHERE user_id = $1 AND token = $2', [id, token]);
}
export async function revokeAllUserSessions(id: string): Promise<void> {
  await db.none('DELETE FROM user_sessions WHERE user_id = $1', [id]);
}

async function handleMissingUser(id: string) {
  console.error(`Data corruption may have occurred! Something references user id ${id}, but that user doesn't exist!!`);
  // TODO implement cleanup
}
