import {randomBytes} from 'crypto';
import {Router, Request, Response} from 'express';
import fetch from 'node-fetch';
import * as cookieParser from 'cookie-parser';
import {getAuthMethodRepo, getSessRepo, getUserRepo} from '@canalapp/shared/dist/db';
import {getSelf} from '@canalapp/shared/dist/util/discord';
import {verifyInviteKey} from '../lib/invite';

const APP_URL = process.env.NODE_ENV === 'production' ? 'https://canal.nz/app' : 'http://localhost:8081';
const API_URL = process.env.NODE_ENV === 'production' ? 'https://api.canal.nz' : 'http://localhost:4080';
const DISCORD_OAUTH_URL = 'https://discordapp.com/api/v6/oauth2';

const AUTH_SCOPES = ['identify', 'email'];
const REDIRECT_URI = API_URL + '/oauth/discord/callback';
const APP_AUTH_CALLBACK = APP_URL + '/auth/callback';
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
  .get('/discord/callback', cookieParser(), async (req: Request, res: Response) => {
    const code = req.query.code;
    if (!code) {
      res.redirect(`${APP_AUTH_CALLBACK}?error=missing-code`);
    }
    // No, I don't know how to properly implement state
    if (!req.query.state || !req.cookies.state || req.cookies.state !== req.query.state) {
      res.redirect(`${APP_AUTH_CALLBACK}?error=invalid-state`);
    }
    // Store key if needed to sign up
    const key = req.cookies.invitekey;

    const tokenRequest = {
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
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
      if (req.query.debug) console.log(code, tokenData);
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


    // Check if user exists
    const existingAuth = await authMethodRepo.findOne({providerId: discordUser.id});
    const newUser = !existingAuth;
    let user;
    // If it does, create a new session
    // If it doesn't, create a new user and assign a session
    if (newUser) {
      if (!key || !await verifyInviteKey(key)) {
        return res.redirect(`${APP_AUTH_CALLBACK}?error=invalid-key`);
      }
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
    const sess = await getSessRepo().createAndSave({
      user,
      authMethod: 'DISCORD',
      creatorIp: req.ip,
      creatorUa: (req.headers['user-agent'] || 'unknown').substr(0, 256)
    });

    let redirectUrl = `${APP_AUTH_CALLBACK}?provider=DISCORD&sess=${sess.token}&expires=${tokenExpiry.getTime()}`;
    if (newUser) redirectUrl += '&newuser=true';
    res.redirect(redirectUrl);
  })
  .get('/discord/start', cookieParser(), async (req: Request, res: Response) => {
    // We don't want to validate the key here, because this endpoint is used for signin too
    const state = generateState();
    const scopes = encodeURIComponent(AUTH_SCOPES.join(' '));

    if (req.query.key) res.cookie('invitekey', req.query.key);
    res.cookie('state', state);

    res.redirect(DISCORD_OAUTH_URL + `/authorize?response_type=code&prompt=none`
      + `&client_id=${DISCORD_CLIENT_ID}&scope=${scopes}&state=${state}`
      + `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`);
  });
export default router;
