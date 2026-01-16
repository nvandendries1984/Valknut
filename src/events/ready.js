import { ActivityType } from 'discord.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';
import { connectDatabase } from '../utils/database.js';
import { Guild } from '../models/Guild.js';

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

            // Register all guilds the bot is currently in
            logger.info('Registering guilds in database...');
            let registeredCount = 0;

            for (const [guildId, guild] of client.guilds.cache) {
                try {
                    await Guild.registerGuild(guild);
                    registeredCount++;
                } catch (error) {
                    logger.error(`Failed to register guild ${guild.name}: ${error.message}`);
                }
            }

            logger.success(`✓ Registered ${registeredCount} guild(s) in database`);

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
