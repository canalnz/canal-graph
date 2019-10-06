import {snowflake} from '@canalapp/shared';
import * as jwt from 'jsonwebtoken';

let key = process.env.INVITE_KEY;
if (!key && process.env.NODE_ENV === 'production') throw new Error('Failed to load invite signing key!');
if (!key) {
  console.error('Warning: defaulting signing key!');
  key = 'secret';
}
const defaultLifespan = 24 * 60 * 60 * 1000; // A day? It'll do

export type InvitePayload = [string, number];

// Create
export async function createInviteKey(lifespan: number = defaultLifespan): Promise<string> {
  const id = await snowflake.nextSnowflake();
  const expiryTime = Date.now() + lifespan;

  return jwt.sign(JSON.stringify([id, expiryTime]), key);
}
// Verify
export async function verifyInviteKey(token: string): Promise<boolean> {
  try {
    const [id, expiryTime] = jwt.verify(token, key) as InvitePayload;
    // TODO add revocation
    // Check it hasn't expired yet
    return expiryTime > Date.now();
  } catch (e) {
    return false;
  }
}

