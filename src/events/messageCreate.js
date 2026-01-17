import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { UserStats } from '../models/UserStats.js';

export default {
    name: 'messageCreate',
    async execute(message) {
        // Ignore bot messages
        if (message.author.bot) return;

        // Track message stats for guild messages
        if (message.guild) {
            try {
                await UserStats.incrementMessageCount(message.author.id, message.guild.id);
            } catch (error) {
                logger.error(`Error tracking message stats: ${error.message}`);
            }
        }

        // Prefix command handling (optional, alongside slash commands)
        if (!message.content.startsWith(config.prefix)) return;

        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        // Find command
        const command = message.client.commands.get(commandName);

        if (!command) return;

        // Log command usage
        logger.debug(`Prefix command used: ${config.prefix}${commandName} by ${message.author.tag}`);

        // Execute command (if legacy prefix commands are supported)
        // This is optional - modern Discord bots primarily use slash commands
    }
};
