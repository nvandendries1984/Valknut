import { ActivityType } from 'discord.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';

export default {
    name: 'clientReady',
    once: true,
    execute(client) {
        logger.success(`${config.botName} is online!`);
        logger.info(`Logged in as ${client.user.tag}`);
        logger.info(`Active in ${client.guilds.cache.size} server(s)`);

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
