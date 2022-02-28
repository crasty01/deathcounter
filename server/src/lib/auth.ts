import { RefreshingAuthProvider } from '@twurple/auth';
import { promises as fs } from 'fs';
import path from 'path';
import { env } from '$/lib/env';
import tokenData from '$/data/token.json'


const clientId = env.TWITCH_CLIENT_ID;
const clientSecret = env.TWITCH_CLIENT_SECRET;

tokenData.accessToken = env.TWITCH_ACCESS_TOKEN;
tokenData.refreshToken = env.TWITCH_REFRESH_TOKEN;

export const authProvider = new RefreshingAuthProvider(
  {
    clientId,
    clientSecret,
    onRefresh: async newTokenData => await fs.writeFile(path.resolve(__dirname, '../data/token.json'), JSON.stringify(newTokenData, null, 4), 'utf-8')
  },
  tokenData
);

// GET https://id.twitch.tv/oauth2/authorize?client_id=quhzcu84hdnzgl3p71zcbbsp71l1ai&redirect_uri=http://localhost&response_type=code&scope=chat:read+chat:edit

// POST https://id.twitch.tv/oauth2/token?client_id=quhzcu84hdnzgl3p71zcbbsp71l1ai&client_secret=liqu0bx91vf50j3sudmebk8ltzgbm9&code=5m43hk031a7fh5ncj2ev3lt2xs8g48&grant_type=authorization_code&redirect_uri=http://localhost