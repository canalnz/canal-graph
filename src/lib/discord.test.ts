import * as testConfig from '../testConfig.secret';
import {buildAvatarUrl, DiscordAPIError, getBotSelf} from './discord';

describe('avatar url builder', () => {
  test('it creates the correct url', () => {
    expect(buildAvatarUrl('191698332014346242', '5d28178fbc89be9a0deab28f76896f56'))
      .toBe('https://cdn.discordapp.com/avatars/191698332014346242/5d28178fbc89be9a0deab28f76896f56.png');
  });

  test('it appends the size', () => {
    expect(buildAvatarUrl('191698332014346242', '5d28178fbc89be9a0deab28f76896f56', 200))
      .toBe('https://cdn.discordapp.com/avatars/191698332014346242/5d28178fbc89be9a0deab28f76896f56.png?size=200');
  });

  test('it can default the avatar', () => {
    expect(buildAvatarUrl('191698332014346242')).toBe('https://cdn.discordapp.com/embed/avatars/1.png');
  });

  test('default avatar can have a size', () => {
    expect(buildAvatarUrl('191698332014346242', undefined, 200))
      .toBe('https://cdn.discordapp.com/embed/avatars/1.png?size=200');
  });
});

describe('get bot self', () => {
  const token = testConfig.botToken;
  test('it should retrieve the bot', async () => {
    expect((await getBotSelf(token)).id).toBe(testConfig.botId);
  });

  test('it should error properly', async () => {
    await expect(getBotSelf('blah')).rejects.toBeInstanceOf(DiscordAPIError);
  });
});
