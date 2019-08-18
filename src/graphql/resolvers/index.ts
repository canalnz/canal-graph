import {dateScalar} from './date';
import botResolvers from './bot';
import scriptResolvers from './script';
import scriptLinkResolvers from './scriptLink';
import userResolvers from './user';

// Who needs scale, pfffttt
const resolvers = {
  ...botResolvers,
  ...scriptResolvers,
  ...scriptLinkResolvers,
  ...userResolvers,
  Query: {
    ...botResolvers.Query,
    ...scriptResolvers.Query,
    ...scriptLinkResolvers.Query,
    ...userResolvers.Query
  },
  Mutation: {
    ...botResolvers.Mutation,
    ...scriptResolvers.Mutation,
    ...scriptLinkResolvers.Mutation,
    ...userResolvers.Mutation
  },
  Date: dateScalar
};
export default resolvers;
