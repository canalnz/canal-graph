import 'reflect-metadata';
import app from './www';
import setupGraphServer from './graphql';
import {gateway} from './gateway/connector';
import {createDbConnection} from './lib/database';

const HTTP_PORT = process.env.HTTP_PORT || 4000;

async function main() {
  // Setup DB
  const conn = createDbConnection();

  // Setup Gateway
  await gateway.setup();

  // Setup Graph
  const graphServer = setupGraphServer(gateway);
  graphServer.applyMiddleware({app});

  // Setup Webserver
  app.listen({port: HTTP_PORT}, () => {
    // tslint:disable-next-line:no-console
    console.log(`⚙️ GraphQL ready at http://localhost:${HTTP_PORT}${graphServer.graphqlPath}`);
  });
}

main();
