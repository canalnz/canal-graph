import {randomBytes} from 'crypto';
import {Router, Request, Response} from 'express';
import fetch from 'node-fetch';
import * as url from 'url';
import {getAuthMethodRepo, getSessRepo, getUserRepo} from '@canalapp/shared/dist/db';
import {getSelf, DiscordUser} from '@canalapp/shared/dist/util/discord';

const APP_URL = process.env.NODE_ENV === 'prod' ? 'https://canal.asherfoster.com' : 'http://localhost:8081';
const API_URL = process.env.NODE_ENV === 'prod' ? 'https://api.canal.asherfoster.com' : 'http://localhost:4080';
const DISCORD_OAUTH_URL = 'https://discordapp.com/api/v6/oauth2';

const AUTH_SCOPES = ['identify', 'email'];
const REDIRECT_URI = API_URL + '/oauth/discord/callback';
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
  throw new TypeError('DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET are required environment variables for auth');
}

function generateState(): string {
  return randomBytes(8).toString('hex');
}

interface DiscordOAuthTokenResponse {
  access_token: string;
  scope: string;
  token_type: string;
  expires_in: number; // Seconds
  refresh_token: string;
}

interface ServerError {
  error: {
    message: string;
    code: string;
  };
  success: false;
}

const router = Router();

router
  .get('/discord/callback', async (req: Request, res: Response) => {
  const code = req.query.code;
  if (!code) {
    res.redirect(`${APP_URL}/auth/callback?error=missing-code`);
  }
  if (!req.query.state) {
    res.redirect(`${APP_URL}/auth/callback?error=invalid-state`);
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
  const tokenResp = await fetch(DISCORD_OAUTH_URL + '/token', {
    method: 'POST',
    body: new URLSearchParams(tokenRequest)
  });
  const tokenData = await tokenResp.json() as DiscordOAuthTokenResponse;
  const tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);

  // TODO Improve error responses
  if (!tokenData.access_token) {
    res.status(400).json({
      error: {
        message: 'The access code you provided didn\'t work :(',
        code: 'invalid-params'
      },
      success: false
    } as ServerError);
    return;
  }
  const discordUser = await getSelf(tokenData.access_token);
  const userRepo = getUserRepo();
  const authMethodRepo = getAuthMethodRepo();
  const sessRepo = getSessRepo();

  // console.log(new User());
  // console.log(userRepo);

  // Check if user exists
  const existingAuth = await authMethodRepo.findOne({providerId: discordUser.id});
  const newUser = !existingAuth;
  let user;
  // If it does, create a new session
  // If it doesn't, create a new user and assign a session
  if (newUser) {
    console.log('User not found, creating new one!');
    user = await userRepo.createAndSave({
      name: discordUser.username,
      email: discordUser.email,
      avatarHash: discordUser.avatar,
      verified: discordUser.verified
    });
    await authMethodRepo.createAndSave({
      user,
      provider: 'DISCORD',
      providerId: discordUser.id,
      expires: tokenExpiry,
      refreshToken: tokenData.refresh_token,
      accessToken: tokenData.access_token
    });
  } else {
    user = await userRepo.findOneOrFail({id: existingAuth.userId});
  }
  console.log('Creating sess for', user.id);
  const sess = await sessRepo.createAndSave({
    user,
    authMethod: 'DISCORD',
    creatorIp: req.ip,
    creatorUa: (req.headers['user-agent'] || 'unknown').substr(0, 256)
  });

  let redirectUrl = `${APP_URL}/auth/callback?provider=DISCORD&sess=${sess.token}&expires=${tokenExpiry.getTime()}`;
  if (newUser) redirectUrl += '&newuser=true';
  console.log('Redirecting to', redirectUrl);
  res.redirect(redirectUrl);
})
  .get('/discord/start', (req: Request, res: Response) => {
    const state = generateState(); // TODO implement state!!
    const scopes = encodeURIComponent(AUTH_SCOPES.join(' '));
    res.redirect(DISCORD_OAUTH_URL + `/authorize?response_type=code&`
      + `client_id=${DISCORD_CLIENT_ID}&scope=${scopes}&state=${state}`
      + `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`);
  });
export default router;
