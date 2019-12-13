import {dateScalar} from './date';
import botResolvers from './bot';
import moduleResolvers from './module';
import moduleLinkResolvers from './moduleLink';
import userResolvers from './user';
import {adminResolvers} from './admin';
import {workspaceResolvers} from './workspace';

let resolvers = {
  Query: {},
  Mutation: {},
  Date: dateScalar
};

[
  botResolvers,
  moduleResolvers,
  moduleLinkResolvers,
  userResolvers,
  adminResolvers,
  workspaceResolvers
].forEach((r) => {
  // Merges it somewhat gracefully
  resolvers = {
    ...resolvers,
    ...r,
    Query: {
      ...resolvers.Query,
      ...r.Query
    },
    Mutation: {
      ...resolvers.Mutation,
      ...r.Mutation
    }
  };
});

export default resolvers;
