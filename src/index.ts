import 'reflect-metadata';
import {createConnection} from 'typeorm';
import {startGatewayServer} from './gateway';
import app from './www';
import setupGraphServer from './graphql';

const HTTP_PORT = process.env.HTTP_PORT || 4000;
const GATEWAY_PORT = process.env.GATEWAY_PORT || 4040;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USERNAME = process.env.DB_USERNAME || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;

async function main() {
  // Setup DB
  const conn = await createConnection({
    type: 'postgres',
    host: DB_HOST,
    port: 5432,
    username: DB_USERNAME,
    password: DB_PASSWORD,
    entities: [
      __dirname + '/entities/**/*.js'
    ],
    synchronize: true,
    logging: ['error']
  });

  // Setup Gateway
  const gateway = await startGatewayServer(+GATEWAY_PORT);

  // Setup Graph
  const graphServer = setupGraphServer(gateway);
  graphServer.applyMiddleware({app});

  // Setup Webserver
  app.listen({port: HTTP_PORT}, () => {
    // tslint:disable-next-line:no-console
    console.log(`🚀 GraphQL ready at http://localhost:${HTTP_PORT}${graphServer.graphqlPath}`);
  });
}

main();
