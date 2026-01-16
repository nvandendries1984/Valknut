import { logger } from '../utils/logger.js';
import { Guild } from '../models/Guild.js';
import { createSuccessEmbed } from '../utils/embedBuilder.js';

export default {
    name: 'guildCreate',
    async execute(guild) {
        try {
            // Register guild in database
            await Guild.registerGuild(guild);

            logger.info(`✅ Bot joined guild: ${guild.name} (${guild.id})`);
            logger.info(`📊 Guild has ${guild.memberCount} members`);

            // Try to send welcome message to system channel or first available text channel
            const welcomeChannel = guild.systemChannel ||
                                 guild.channels.cache.find(ch => ch.isTextBased() && ch.permissionsFor(guild.members.me).has('SendMessages'));

            if (welcomeChannel) {
                const embed = createSuccessEmbed(
                    `Thanks for adding me to **${guild.name}**!\n\n` +
                    `Use \`/help\` to see all available commands.\n` +
                    `Use \`/setlogchannel\` to configure a log channel (Admin only).\n\n` +
                    `For support or questions, contact the bot owner.`
                )
                    .setTitle('👋 Hello!')
                    .setThumbnail(guild.client.user.displayAvatarURL());

                await welcomeChannel.send({ embeds: [embed] });
            }

        } catch (error) {
            logger.error(`Failed to register guild ${guild.name}: ${error.message}`);
        }
    }
};
