import {dateScalar} from './date';
import botResolvers from './bot';
import moduleResolvers from './module';
import moduleLinkResolvers from './moduleLink';
import userResolvers from './user';
import {adminResolvers} from './admin';

// Who needs to scale, pfffttt
const resolvers = {
  ...botResolvers,
  ...moduleResolvers,
  ...moduleLinkResolvers,
  ...userResolvers,
  ...adminResolvers,
  Query: {
    ...botResolvers.Query,
    ...moduleResolvers.Query,
    ...moduleLinkResolvers.Query,
    ...userResolvers.Query,
    ...adminResolvers.Query
  },
  Mutation: {
    ...botResolvers.Mutation,
    ...moduleResolvers.Mutation,
    ...moduleLinkResolvers.Mutation,
    ...userResolvers.Mutation,
    ...adminResolvers.Mutation
  },
  Date: dateScalar
};
export default resolvers;
