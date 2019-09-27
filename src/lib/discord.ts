import fetch from 'node-fetch';

const DISCORD_API_BASE = 'https://discordapp.com/api/v6';
const DISCORD_CDN = 'https://cdn.discordapp.com';

export type HttpMethod = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH' | 'UPDATE';
export interface Headers {
  [headerName: string]: string;
}

export class DiscordAPIError extends Error {
  constructor(public code: string, public message: string) {
    super();
  }
}

export function buildAvatarUrl(user: string, hash?: string, size?: number): string {
  const sizeString = size ? '?size=' + size : '';
  if (!hash) {
    // TODO Implement discriminator based defaults
    console.warn('We should fix user data someday');
    return DISCORD_CDN + '/embed/avatars/1.png' + sizeString;
  }
  return DISCORD_CDN + '/avatars/' + user + '/' + hash + '.png' + sizeString;
}

export interface DiscordUser {
  username: string;
  verified?: boolean;
  locale?: string;
  mfa_enabled?: boolean;
  bot?: boolean;
  id: string;
  flags?: number;
  avatar: string;
  discriminator: string;
  email?: string | null;
}
export async function getBotSelf(token: string): Promise<DiscordUser> {
  return discordRestRequest<DiscordUser>({
    endpoint: '/users/@me',
    auth: 'Bot ' + token
  });
}

export interface DiscordRestOptions {
  method?: HttpMethod;
  endpoint: string;
  auth: string;
  payload?: any;
  mimeType?: string;
}
export async function discordRestRequest<T>({
                                              method = 'GET',
                                              endpoint, payload, mimeType, auth
                                            }: DiscordRestOptions): Promise<T> {
  const headers: Headers = {
    Authorization: auth,
  };
  if (payload) {
    headers['Content-Type'] = mimeType || 'application/json';
  }
  const url = DISCORD_API_BASE + endpoint;
  const r = await fetch(url, {
    method,
    body: payload ? JSON.stringify(payload) : undefined,
    headers
  });
  const body = await r.json();
  if (!r.ok) throw new DiscordAPIError(body.code, body.message);
  return body;
}
