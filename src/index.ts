import 'reflect-metadata';
import app from './www';
import setupGraphServer from './graphql';
import {createDbConnection} from '@canalapp/shared/dist/db';
import {pubsub} from '@canalapp/shared';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USERNAME = process.env.DB_USERNAME || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD as string; // This cast isn't safe, but typescript isn't noticing the guard?
const DB_PORT = +(process.env.DB_PORT || 5432);

if (!DB_PASSWORD) throw new Error('DB_PASSWORD environment variable is required!');

const HTTP_PORT = process.env.HTTP_PORT || 4080;

async function main() {
  // Setup pubsub
  pubsub.setup();
  // Setup DB
  const conn = createDbConnection({
    host: DB_HOST,
    username: DB_USERNAME,
    password: DB_PASSWORD,
    port: DB_PORT
  });

  // Setup Graph
  const graphServer = setupGraphServer();
  graphServer.applyMiddleware({app});

  // Setup Webserver
  app.listen({port: HTTP_PORT}, () => {
    // tslint:disable-next-line:no-console
    console.log(`⚙️ GraphQL ready at http://localhost:${HTTP_PORT}${graphServer.graphqlPath}`);
  });
}

main();
