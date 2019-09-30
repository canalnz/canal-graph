import {Connection, createConnection} from 'typeorm';
import * as path from 'path';

export interface DatabaseConnectionOptions {
  host?: string;
  database?: string;
  username?: string;
  password: string;
  port?: number;
}

export async function createDbConnection({
  host = 'localhost',
  username = 'postgres',
  database = 'canal',
  password,
  port = 5432
}: DatabaseConnectionOptions): Promise<Connection> {
  return await createConnection({
    type: 'postgres',
    database,
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
