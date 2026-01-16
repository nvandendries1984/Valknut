import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config, validateConfig } from './config/config.js';
import { logger } from './utils/logger.js';
import { connectDatabase, disconnectDatabase } from './utils/database.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';

// Validate configuration
try {
    validateConfig();
} catch (error) {
    logger.error(error.message);
    process.exit(1);
}

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction
    ]
});

// Load commands and events
await loadCommands(client);
await loadEvents(client);

// Connect to MongoDB
try {
    await connectDatabase();
} catch (error) {
    logger.error('Failed to connect to database, exiting...');
    process.exit(1);
}

// Set client in logger for Discord logging
logger.setClient(client);

// Error handling
process.on('unhandledRejection', error => {
    logger.error(`Unhandled promise rejection: ${error.message}`);
});

process.on('uncaughtException', error => {
    logger.error(`Uncaught exception: ${error.message}`);
    disconnectDatabase().finally(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await disconnectDatabase();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await disconnectDatabase();
    process.exit(0);
});

// Login
client.login(config.token).catch(error => {
    logger.error(`Failed to login: ${error.message}`);
    process.exit(1);
});
