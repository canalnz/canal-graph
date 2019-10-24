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
    enum Platform {
        """
        A loose description of where a Script will be executed
        """
        NODEJS
    }
    enum BotState {
        """
        The State of a bot at the end of a Connection
        """
        OFFLINE
        FAILED
        STARTUP
        ONLINE
        ERROR
    }
    enum ScriptState {
        """
        What a Script is up to
        """
        STOPPED
        RUNNING
        PASSIVE
        ERROR
    }
    scalar Date # ISO String

    type User {
        """
        A account on Canal
        """
        id: String!
        name: String
        avatarUrl: String
        discordId: String
        admin: Boolean
    }
    type ClientUser {
        """
        You, the logged in User. Shows extra info like email
        """
        id: String!
        name: String!
        avatarUrl: String!
        email: String!
        created: Date!
        discordId: String
        admin: Boolean!
    }
    input UserUpdateInput {
        id: String
        name: String
        email: String
    }

    type Bot {
        id: String!
        name: String!
        discriminator: String
        discordId: String
        token: String!
        avatarUrl: String
        platform: Platform!
        apiKey: String!
        resourceOwner: User!
        created: Date!
        createdBy: User
        connection: BotConnection
        scripts(first: Int = 10, after: String): ScriptLinks!
        script(id: String!): ScriptLink
        permissions: [BotPermission!]! # At the moment this doesn't seem worth paginating
        options: BotOptions!
    }
    type Bots {
        totalCount: Int!
        nodes: [Bot!]!
    }
    type BotConnection {
        state: BotState
        created: Date
    }
    type BotOptions {
        token: String
        commandMode: String
    }
    input BotOptionsInput {
        token: String
        commandMode: String
    }
    input BotCreateInput {
        platform: String!
        token: String
    }
    input BotUpdateInput {
        id: String!
        platform: String
    }

    # Jesus christ this is a lot of types for a tiny feature
    enum BotPermissionQualifierType {
        USER
        ROLE
        CHANNEL
        GUILD
    }
    type BotPermissionQualifier {
        id: String!
        type: String!
        value: String!
    }
    type BotPermission {
        id: String!
        name: String!
        qualifiers: [BotPermissionQualifier!]!
    }
    input BotPermissionCreateInput {
        bot: String!
        name: String!
    }
    input BotPermissionQualifierInput {
        id: String # If this is missing, a new qualifier will be created. If present, it will be updated
        delete: Boolean # If this and ID is present, the Qualifier will be removed
        type: String
        value: String
    }
    input BotPermissionUpdateInput {
        id: String!
        name: String
        qualifiers: [BotPermissionQualifierInput]!
    }

    type Script {
        id: String!
        name: String!
        body: String!
        platform: Platform!
        resourceOwner: User!
        created: Date!
        createdBy: User
        updated: Date
        updatedBy: User
    }
    type Scripts {
        totalCount: Int!
        nodes: [Script!]!
    }
    input ScriptCreateInput {
        name: String!
        body: String!
        platform: Platform
    }
    input ScriptUpdateInput {
        id: String!
        name: String
        body: String
        platform: Platform
    }

    type ScriptLink {
        script: Script!
        bot: Bot!
        lastStarted: Date
        state: ScriptState
        created: Date!
        createdBy: User
    }
    type ScriptLinks {
        totalCount: Int!
        nodes: [ScriptLink!]!
    }

    type Query {
        bots(first: Int = 10, after: String): Bots!
        bot(id: String!): Bot

        scripts(first: Int = 10, after: String): Scripts!
        script(id: String!): Script

        user: ClientUser!
        users: [User!]
    }

    type Mutation {
        # Script CRUD
        createScript(script: ScriptCreateInput): Script
        updateScript(script: ScriptUpdateInput!): Script
        deleteScript(script: String!): String!

        # ScriptLink CRUD
        addScriptToBot(script: String!, bot: String!): ScriptLink!
        removeScriptFromBot(script: String!, bot: String!): String!
        restartScriptOnBot(script: String!, bot: String!): ScriptLink!
        restartScriptEverywhere(script: String!): [ScriptLink]!

        # Bot CRUD
        createBot(bot: BotCreateInput!): Bot
        updateBot(bot: BotUpdateInput!): Bot
        deleteBot(bot: String!): String!

        # Bot Permission CRUD
        createBotPermission(perm: BotPermissionCreateInput!): BotPermission!
        updateBotPermission(perm: BotPermissionUpdateInput!): BotPermission!
        deleteBotPermission(perm: String!): String!

        # User CRUD
        updateUser(user: UserUpdateInput): User!
        destroySession: String!
        destroyAllSessions(user: String): String!
        deleteUser(user: String): String!
        setUserFlag(user: String!, name: String!, value: Boolean): Boolean


        createInviteKey(lifespan: Int): String
    }
`;

export default typeDefs;
