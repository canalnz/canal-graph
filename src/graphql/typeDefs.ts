import {gql} from 'apollo-server';
import {User} from '@canalapp/shared/dist/db';

export interface Paginated<T> {
  nodes: T[];
  totalCount: number;
}
export interface GraphContext {
    token: string;
    user: User;
}

const typeDefs = gql`
    enum Runtime {
        """
        Available runtimes to run a script
        """
        JAVASCRIPT
        #  JAVASCRIPT_V2 in future, or perhaps rebind it?
    }
    # enum Platform {
    #     """
    #     Which Chat platform to target. Currently hidden away from user
    #     """
    #     DISCORD
    #     SLACK
    # }
    enum ModuleState {
        """
        Different states a module can be in
        """
        NONE
        RUNNING
        ERROR
    }
    scalar Date # ISO String

    type User {
        """
        A account on Canal
        """
        id: String!
        name: String!
        avatarUrl: String!
        avatarHash: String
        admin: Boolean
    }
    type ClientUser {
        """
        You, the logged in User. Shows extra info like email
        """
        id: String!
        name: String!
        avatarUrl: String!
        avatarHash: String
        email: String
        created: Date!
        admin: Boolean
    }
    input ProfileUpdateInput {
        name: String
        email: String
    }

    interface Bot {
        id: String!
        name: String!
        avatarHash: String
        avatarUrl: String!
        runtime: Runtime!
        resourceOwner: User!
        created: Date!
        createdBy: User
        modules: ModuleLinks!
        module(id: String!): ModuleLink
    }
    type DiscordBot implements Bot {
        id: String!
        name: String!
        avatarHash: String
        avatarUrl: String!
        runtime: Runtime!
        resourceOwner: User!
        created: Date!
        createdBy: User
        modules: ModuleLinks!
        module(id: String!): ModuleLink


        discordUsername: String!
        discordDiscriminator: String!
        discordId: String!
        token: String!
    }

    #type SlackBot implements Bot {
    #    id: String!
    #    name: String!
    #    avatarHash: String
    #    avatarUrl: String!
    #    runtime: Runtime!
    #    resourceOwner: User!
    #    created: Date!
    #    createdBy: User
    #    modules: ModuleLinks!
    #    module(id: String!): ModuleLink
    #
    #
    #    displayName: String!
    #    slackId: String!
    #    token: String!
    #}

    type Bots {
        totalCount: Int!
        nodes: [Bot!]!
    }
    input BotCreateInput {
        runtime: Runtime
        token: String
    }
    input BotUpdateInput {
        id: String!
        runtime: Runtime
    }

    type BotAccess {
        user: User!
        bot: Bot!
        permissions: Int!
        created: Date!
        createdBy: User
    }

    type Workspace {
        id: String!
        name: String!
        resourceOwner: User!
        isPersonal: Boolean
        users: [WorkspaceAccess]
        modules: [Module]!
    }

    type WorkspaceAccess {
        user: User!
        workspace: Workspace!
        permissions: Int! # Bitfield representing permissions (Discord style!)
        created: Date!
        createdBy: User
    }

    input CreateWorkspaceInput {
        name: String!
    }
    input UpdateWorkspaceInput {
        id: String!
        name: String
    }

    type Module {
        id: String!
        name: String!
        body: String!
        deployedBody: String!
        runtime: Runtime!
        workspace: Workspace
        created: Date!
        createdBy: User
        updated: Date
        updatedBy: User
    }
    type Modules {
        totalCount: Int!
        nodes: [Module!]!
    }
    input ModuleCreateInput {
        name: String
        body: String
        runtime: Runtime!
        workspace: String!
    }
    input ModuleUpdateInput {
        id: String!
        name: String
        body: String
        deployed_body: String
        runtime: Runtime
    }

    type ModuleLink {
        module: Module!
        bot: Bot!
        state: ModuleState
        created: Date!
        createdBy: User
    }
    type ModuleLinks {
        totalCount: Int!
        nodes: [ModuleLink!]!
    }

    type Query {
        bots(first: Int = 10, after: String): Bots!
        bot(id: String!): Bot

        workspaces: [Workspace]!
        workspace(id: String!): Workspace

        module(id: String!): Module

        user: ClientUser!
        users: [User!]
    }

    type Mutation {
        # Workspace CRUD
        createWorkspace(workspace: CreateWorkspaceInput!): Workspace
        updateWorkspace(workspace: UpdateWorkspaceInput!): Workspace!
        deleteWorkspace(id: String!): String! # This endpoint will delete if owner, otherwise just revoke access

        # Module CRUD
        createModule(module: ModuleCreateInput!): Module
        updateModule(module: ModuleUpdateInput!): Module!
        deleteModule(id: String!): String!

        # ModuleLink CRUD
        linkModuleToBot(module: String!, bot: String!): ModuleLink
        removeModuleFromBot(module: String!, bot: String!): String!

        # Bot CRUD
        createBot(bot: BotCreateInput!): Bot
        updateBot(bot: BotUpdateInput!): Bot!
        deleteBot(bot: String!): String!

        # User CRUD
        updateProfile(user: ProfileUpdateInput): ClientUser!
        destroySession: String!
        destroyAllSessions(user: String): String!
        deleteUser(user: String): String!

        # Platform administation stuff
        setUserFlag(user: String!, name: String!, value: Boolean): Boolean
        createInviteKey(lifespan: Int): String!
    }
`;

export default typeDefs;
