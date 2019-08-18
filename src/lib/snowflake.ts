import * as FlakeId from 'flake-idgen';
import * as intFormat from 'biguint-format';

const canalEpoch = new Date('2019-01-01T00:00:00.000Z');

const generator = new FlakeId({
  epoch: +canalEpoch
});

export async function nextSnowflake(): Promise<string> {
  return new Promise((resolve, reject) => {
    generator.next((err, val) => {
      if (err) return reject(err);
      resolve(intFormat(val, 'dec'));
    });
  });
}
export function nextSnowflakeSync(): string {
  return intFormat(generator.next(), 'dec');
}
