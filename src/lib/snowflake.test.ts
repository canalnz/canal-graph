import {nextSnowflake, nextSnowflakeSync} from './snowflake';

const SNOWFLAKE_REGEX = /^[0-9]{16,19}$/;

test('should look like a snowflake', async () => {
  expect(await nextSnowflake()).not.toBeFalsy();

  // Expects between 16 and 19 digits
  expect(await nextSnowflake()).toMatch(SNOWFLAKE_REGEX);
});

test('should be unique', async () => {
  const count = 100;
  const promises = [];
  // Generate them all as fast as possible
  for (let i = 0; i < count; i++) {
    promises.push(nextSnowflake());
  }
  const vals = await Promise.all(promises);
  // Checks the first index of every string is the given one
  expect(vals.every((v, i) => vals.indexOf(v) === i)).toBe(true);
});

test('sync should be synchronous', () => {
  expect(nextSnowflakeSync()).not.toBeInstanceOf(Promise);
  expect(nextSnowflakeSync()).toMatch(SNOWFLAKE_REGEX);
});
