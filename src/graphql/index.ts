import {ApolloServer, AuthenticationError} from 'apollo-server-express';
import typeDefs, {GraphContext} from './typeDefs';
import resolvers from './resolvers';
import {authenticateHttpRequest} from '../lib/auth';
import {GatewayServer} from '../gateway';

export default function setupGraphServer(gateway: GatewayServer) {
  return new ApolloServer({
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
};
