import * as Pgp from 'pg-promise';
const pgp = Pgp();

export const db = pgp({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD
});

export * from './bot';
export * from './botPermission';
export * from './script';
export * from './user';
