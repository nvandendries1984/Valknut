import { Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadCommands(client) {
    client.commands = new Collection();
    const commandsPath = join(__dirname, '../commands');

    try {
        const commandFolders = readdirSync(commandsPath);

        for (const folder of commandFolders) {
            const folderPath = join(commandsPath, folder);
            const commandFiles = readdirSync(folderPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = join(folderPath, file);
                const command = await import(`file://${filePath}`);

                if ('data' in command.default && 'execute' in command.default) {
                    client.commands.set(command.default.data.name, command.default);
                    logger.info(`Command loaded: ${command.default.data.name}`);
                } else {
                    logger.warn(`Command in ${file} is missing required "data" or "execute" property`);
                }
            }
        }

        logger.success(`${client.commands.size} commands loaded successfully`);
    } catch (error) {
        logger.error(`Error loading commands: ${error.message}`);
    }
}
