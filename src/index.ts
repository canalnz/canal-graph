import {ApolloServer, AuthenticationError} from 'apollo-server-express';
import {startGatewayServer} from './gateway';
import typeDefs, {GraphContext} from './graphql/typeDefs';
import resolvers from './graphql/resolvers';
import app from './www';
import {authenticateHttpRequest} from './lib/auth';

const HTTP_PORT = process.env.HTTP_PORT || 4000;
const GATEWAY_PORT = process.env.GATEWAY_PORT || 4040;

async function main() {
  const gateway = await startGatewayServer(+GATEWAY_PORT);
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    tracing: true,
    async context({req}): Promise<GraphContext> {
      const authInfo = await authenticateHttpRequest(req);
      if (!authInfo) throw new AuthenticationError('You must be logged in to view this API');
      if (!authInfo.user) throw new AuthenticationError('Invalid Authorization');
      return {
        gateway,
        user: authInfo.user,
        token: authInfo.token
      };
    }
  });
  server.applyMiddleware({app});
  app.listen({port: HTTP_PORT}, () => {
    // tslint:disable-next-line:no-console
    console.log(`🚀 Server ready at http://localhost:${HTTP_PORT}${server.graphqlPath}`);
  });
}

main();
