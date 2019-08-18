import {MockList} from 'graphql-tools';

const BOT_NAMES = [
  'Pointless Bot',
  'Pointless Bot (Dev)',
  'Spooky',
  'Testing bot, woo',
  'Thing.exe'
];

const SCRIPT_NAMES = [
  'autopin',
  'autodel',
  'cachemessage',
  'randommeme',
  'channelconfig'
];

const SCRIPT_CONTENTS = [
  'if(diamonded)\n  pin()',
  'if(sworded)\n  delete()',
  'command(cachemessage, () => {\n  getMessage(args.id)\n})',
  'channel.config = await storage.get(`channel-config-${channel.id}`)',
  'every500Messages(() => send(randomMeme()))'
];

const AVATAR_URLS = [
  '//cdn.discordapp.com/avatars/269783357297131521/80c311e9817186aa764c53bd0800edba.png?size=256',
  '//cdn.discordapp.com/avatars/328441126023331850/e49ac366ce50d67a396d1d6bd186c5b9.png?size=256',
  '//cdn.discordapp.com/avatars/221025645617086464/87d2474523a48e40949e14327e2f01c2.png?size=256'
];

function randomSnowflake(): string {
  return Math.random().toString().replace('.', '0');
}
function randomInt(minOrMax: number, max: number): number {
  if (!max) {
    return Math.floor(Math.random() * minOrMax);
  } else {
    return Math.floor(Math.random() * (max - minOrMax)) + minOrMax;
  }
}
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const mocks = {
  Date: () => new Date(Date.now() - (Math.random() * 1e8)),
  Bot: () => ({
    id: randomSnowflake(),
    avatarUrl: randomItem(AVATAR_URLS),
    name: randomItem(BOT_NAMES),
    runningScriptCount: randomInt(0, 5)
  }),
  Bots: () => ({
    totalCount: randomInt(0, 5),
    nodes: () => new MockList([0, 4])
  }),
  Script: () => ({
    id: randomSnowflake(),
    name: randomItem(SCRIPT_NAMES),
    body: randomItem(SCRIPT_CONTENTS)
  }),
  Scripts: () => ({
    totalCount: randomInt(0, 5),
    nodes: () => new MockList([0, 5])
  }),
};
