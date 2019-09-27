import {Connection, createConnection} from 'typeorm';
import * as path from 'path';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USERNAME = process.env.DB_USERNAME || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_PORT = +(process.env.DB_PORT || 5432);

export interface DatabaseConnectionOptions {
  host?: string;
  username?: string;
  password?: string;
  port?: number;
}

export async function createDbConnection({
  host = DB_HOST,
  username = DB_USERNAME,
  password = DB_PASSWORD,
  port = DB_PORT
}: DatabaseConnectionOptions = {
  host: DB_HOST,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  port: DB_PORT
}): Promise<Connection> {
  return await createConnection({
    type: 'postgres',
    database: 'canal',
    host,
    port,
    username,
    password,
    entities: [
      path.resolve(__dirname, '../entities/**/*.js')
    ],
    synchronize: false, // Be careful with this. It drops stuff
    logging: ['error']
    // logging: true
  });
}
