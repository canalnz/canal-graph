import * as express from 'express';
import fetch from 'node-fetch';
import * as url from 'url';
import {findUserIdByDiscordId, createUserSession, createUser, createOAuthLink} from '../db';

const APP_BASE_URL = 'http://localhost:8081';
const DISCORD_TOKEN_ENDPOINT = 'https://discordapp.com/api/v6/oauth2/token';
const DISCORD_SELF_ENDPOINT = 'https://discordapp.com/api/v6/users/@me';
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
  throw new TypeError('DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET are required environment variables for auth');
}

interface DiscordOAuthTokenResponse {
  access_token: string;
  scope: string;
  token_type: string;
  expires_in: number; // Seconds
  refresh_token: string;
}
interface DiscordUserResponse {
  username: string;
  verified: boolean;
  locale: string;
  mfa_enabled: boolean;
  flags: number;
  avatar: string; // TODO Can this be null?
  discriminator: string;
  id: string;
  email: string;
}
interface ServerError {
  error: {
    message: string;
    code: string;
  };
  success: false;
}

const router = express.Router();

function makeDiscordAvatarUrl(user: string, hash: string): string {
  return `https://cdn.discordapp.com/avatars/${user}/${hash}.png`;
}

router.get('/discord/callback', async (req: express.Request, res: express.Response) => {
  const code = req.query.code;
  if (!code) {
    res.redirect(`${APP_BASE_URL}/auth/complete?error=missing-code`);
  }
  if (!req.query.state) {
    res.redirect(`${APP_BASE_URL}/auth/complete?error=invalid-state`);
  }
  // TODO Verify state

  const tokenRequest = {
    client_id: DISCORD_CLIENT_ID,
    client_secret: DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    // God I hate this line. Should probably change it?
    redirect_uri: req.secure ? 'https://' : 'http://' + req.headers.host + url.parse(req.originalUrl).pathname,
    scope: 'identify email'
  };
  const tokenResp = await fetch(DISCORD_TOKEN_ENDPOINT, {
    method: 'POST',
    body: new URLSearchParams(tokenRequest)
  });
  const tokenData = await tokenResp.json() as DiscordOAuthTokenResponse;
  const tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);

  // TODO Improve error responses
  if (!tokenData.access_token) {
    console.log(tokenData, tokenRequest);
    res.status(400).json({
      error: {
        message: 'The access code you provided didn\'t work :(',
        code: 'invalid-params'
      },
      success: false
    } as ServerError);
    return;
  }
  const userResp = await fetch(DISCORD_SELF_ENDPOINT, {
    headers: {
      Authorization: 'Bearer ' + tokenData.access_token
    }
  });
  const discordUser = await userResp.json() as DiscordUserResponse;
  // Check if user exists
  let userId = await findUserIdByDiscordId(discordUser.id);

  // If it does, create a new session
  // If it doesn't, create a new user and assign a session
  if (!userId) {
    const newUser = await createUser({
      name: discordUser.username,
      email: discordUser.email,
      avatarUrl: makeDiscordAvatarUrl(discordUser.id, discordUser.avatar)
    });
    userId = newUser.id;

    await createOAuthLink({
      user_id: newUser.id,
      provider: 'DISCORD',
      provider_id: discordUser.id,
      expires: tokenExpiry,
      refresh_token: tokenData.refresh_token,
      access_token: tokenData.access_token
    });
  }
  const sess = await createUserSession(userId, {
    auth_method: 'DISCORD',
    ip: req.ip,
    ua: (req.headers['user-agent'] || 'unknown').substr(0, 256)
  });

  const expiryTime = Math.floor((sess.expires.getTime() - Date.now()) / 1000);
  let redirectUrl = `${APP_BASE_URL}/auth/complete?provider=DISCORD&sess=${sess.token}&expires=${expiryTime}`;
  if (!userId) redirectUrl += '&newuser=true';
  res.redirect(redirectUrl);
});
export default router;
