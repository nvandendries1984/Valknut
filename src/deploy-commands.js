import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config, validateConfig } from './config/config.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate configuration
try {
    validateConfig();
} catch (error) {
    logger.error(error.message);
    process.exit(1);
}

const commands = [];
const commandsPath = join(__dirname, 'commands');

// Load all commands
const commandFolders = readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = join(commandsPath, folder);
    const commandFiles = readdirSync(folderPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = join(folderPath, file);
        const command = await import(`file://${filePath}`);

        if ('data' in command.default && 'execute' in command.default) {
            commands.push(command.default.data.toJSON());
            logger.info(`Command added for deployment: ${command.default.data.name}`);
        }
    }
}

// Deploy commands
const rest = new REST().setToken(config.token);

(async () => {
    try {
        logger.info(`Started deploying ${commands.length} slash commands...`);

        // For global deployment (all servers)
        const data = await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands }
        );

        // For guild-specific deployment (faster for testing)
        // Uncomment below and comment above for guild-only deployment
        /*
        const data = await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands }
        );
        */

        logger.success(`Successfully deployed ${data.length} slash commands!`);
    } catch (error) {
        logger.error(`Error deploying commands: ${error.message}`);
    }
})();
