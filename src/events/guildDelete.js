import { logger } from '../utils/logger.js';
import { Guild } from '../models/Guild.js';

export default {
    name: 'guildDelete',
    async execute(guild) {
        try {
            // Mark guild as inactive in database
            const dbGuild = await Guild.findByGuildId(guild.id);

            if (dbGuild) {
                dbGuild.active = false;
                await dbGuild.save();

                logger.info(`❌ Bot removed from guild: ${guild.name} (${guild.id})`);
            }

        } catch (error) {
            logger.error(`Failed to update guild status ${guild.name}: ${error.message}`);
        }
    }
};
