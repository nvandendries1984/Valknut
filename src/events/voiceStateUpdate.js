import { logger } from '../utils/logger.js';
import { UserStats } from '../models/UserStats.js';

export default {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        // Ignore bot users
        if (newState.member.user.bot) return;

        const userId = newState.member.user.id;
        const guildId = newState.guild.id;

        try {
            // User joined a voice channel
            if (!oldState.channel && newState.channel) {
                await UserStats.startVoiceSession(userId, guildId);
                logger.debug(`Voice session started for ${newState.member.user.tag} in ${newState.guild.name}`);
            }
            // User left a voice channel
            else if (oldState.channel && !newState.channel) {
                await UserStats.endVoiceSession(userId, guildId);
                logger.debug(`Voice session ended for ${newState.member.user.tag} in ${newState.guild.name}`);
            }
            // User moved between channels (end old session, start new one)
            else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
                await UserStats.endVoiceSession(userId, guildId);
                await UserStats.startVoiceSession(userId, guildId);
                logger.debug(`Voice session moved for ${newState.member.user.tag} in ${newState.guild.name}`);
            }
        } catch (error) {
            logger.error(`Error tracking voice stats: ${error.message}`);
        }
    }
};
