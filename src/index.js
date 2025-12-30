import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config, validateConfig } from './config/config.js';
import { logger } from './utils/logger.js';
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

// Error handling
process.on('unhandledRejection', error => {
    logger.error(`Unhandled promise rejection: ${error.message}`);
});

process.on('uncaughtException', error => {
    logger.error(`Uncaught exception: ${error.message}`);
    process.exit(1);
});

// Login
client.login(config.token).catch(error => {
    logger.error(`Failed to login: ${error.message}`);
    process.exit(1);
});
