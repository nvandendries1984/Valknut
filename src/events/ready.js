import { ActivityType } from 'discord.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { connectDatabase } from '../utils/database.js';

export default {
    name: 'clientReady',
    once: true,
    async execute(client) {
        logger.success(`${config.botName} is online!`);
        logger.info(`Logged in as ${client.user.tag}`);
        logger.info(`Active in ${client.guilds.cache.size} server(s)`);

        // Connect to MongoDB after bot is ready
        try {
            await connectDatabase();
        } catch (error) {
            logger.error('Failed to connect to database');
        }

        // Set bot status
        client.user.setPresence({
            activities: [{
                name: `${config.prefix}help | ${client.guilds.cache.size} servers`,
                type: ActivityType.Watching
            }],
            status: 'online'
        });
    }
};
