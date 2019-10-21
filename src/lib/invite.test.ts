import {createInviteKey} from './invite';

describe('create invite keys', () => {
  it('should create the key predictably', async () => {
    const key = await createInviteKey(1);
    const [meta, payload, sig] = key.split('.');
    expect(meta).toBeTruthy();
    expect(payload).toBeTruthy();
    expect(sig).toBeTruthy();

    const [id, exp] = JSON.parse(Buffer.from(payload, 'base64').toString());

    // Ideally we could check that the id is roughly close, but we can't convert it to a number to this is hard
    // expect(id).toBeCloseTo(await nextSnowflake());
    expect(exp).toBe(1);
  });
});
