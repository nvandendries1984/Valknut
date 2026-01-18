import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../../models/User.js';
import { UserStats } from '../../models/UserStats.js';
import { canExecuteCommand } from '../../utils/permissions.js';
import { createErrorEmbed } from '../../utils/embedBuilder.js';
import { logger } from '../../utils/logger.js';

export default {
    category: 'moderation',
    data: new SlashCommandBuilder()
        .setName('viewuserstats')
        .setDescription('View complete user information and statistics (moderator only)')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to view information for')
                .setRequired(true)
        ),

    async execute(interaction) {
        // Check permissions (mod role or server owner)
        const permissionCheck = await canExecuteCommand(interaction);
        if (!permissionCheck.allowed) {
            return interaction.reply({
                embeds: [createErrorEmbed(permissionCheck.reason)],
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');

        // Don't allow stats for bots
        if (targetUser.bot) {
            return interaction.reply({
                embeds: [createErrorEmbed('Cannot view information for bot users!')],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            // Fetch user from database
            const dbUser = await User.findByUserId(targetUser.id, interaction.guild.id);

            if (!dbUser) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('This user is not registered in the database. They need to use `/register` first!')]
                });
            }

            // Fetch stats for different periods
            const [stats1day, stats7days, stats14days] = await Promise.all([
                UserStats.getStatsForPeriod(targetUser.id, interaction.guild.id, 1),
                UserStats.getStatsForPeriod(targetUser.id, interaction.guild.id, 7),
                UserStats.getStatsForPeriod(targetUser.id, interaction.guild.id, 14)
            ]);

            // Helper function to format time
            const formatTime = (seconds) => {
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = seconds % 60;

                const parts = [];
                if (hours > 0) parts.push(`${hours}h`);
                if (minutes > 0) parts.push(`${minutes}m`);
                if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

                return parts.join(' ');
            };

            // Helper function to format date
            const formatDate = (date) => {
                if (!date) return 'Not set';
                return new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            };

            // Build embed
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📋 User Profile & Statistics')
                .setDescription(`Complete information for ${targetUser}`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }));

            // Personal Information
            const personalInfo = [];
            if (dbUser.onboarding.name) personalInfo.push(`**Name:** ${dbUser.onboarding.name}`);
            if (dbUser.onboarding.dateOfBirth) personalInfo.push(`**Date of Birth:** ${dbUser.onboarding.dateOfBirth}`);
            if (dbUser.onboarding.email) personalInfo.push(`**Email:** ${dbUser.onboarding.email}`);
            if (dbUser.onboarding.phoneNumber) personalInfo.push(`**Phone:** ${dbUser.onboarding.phoneNumber}`);
            if (dbUser.onboarding.address) personalInfo.push(`**Address:** ${dbUser.onboarding.address}`);
            if (dbUser.onboarding.postcode) personalInfo.push(`**Postcode:** ${dbUser.onboarding.postcode}`);
            if (dbUser.onboarding.woonplaats) personalInfo.push(`**City:** ${dbUser.onboarding.woonplaats}`);
            if (dbUser.onboarding.rank) personalInfo.push(`**Rank:** ${dbUser.onboarding.rank}`);
            if (dbUser.onboarding.year) personalInfo.push(`**Year:** ${dbUser.onboarding.year}`);

            if (personalInfo.length > 0) {
                embed.addFields({
                    name: '👤 Personal Information',
                    value: personalInfo.join('\n'),
                    inline: false
                });
            } else {
                embed.addFields({
                    name: '👤 Personal Information',
                    value: '*No personal information available*',
                    inline: false
                });
            }

            // Saga & Progress
            const sagaInfo = [];
            if (dbUser.onboarding.saga) {
                sagaInfo.push(`**Saga:** ${dbUser.onboarding.saga}`);
            } else {
                sagaInfo.push(`**Saga:** Not assigned`);
            }

            if (dbUser.onboarding.sagaLevel !== null && dbUser.onboarding.sagaLevel !== undefined) {
                sagaInfo.push(`**Saga Level:** ${dbUser.onboarding.sagaLevel}`);
            }

            if (dbUser.onboarding.datumRecruit) {
                sagaInfo.push(`**Recruit Date:** ${formatDate(dbUser.onboarding.datumRecruit)}`);
            }

            if (dbUser.onboarding.datumWarrior) {
                sagaInfo.push(`**Warrior Date:** ${formatDate(dbUser.onboarding.datumWarrior)}`);
            }

            if (dbUser.onboarding.dateRegistered) {
                sagaInfo.push(`**Registered:** ${formatDate(dbUser.onboarding.dateRegistered)}`);
            }

            embed.addFields({
                name: '⚔️ Saga & Progress',
                value: sagaInfo.length > 0 ? sagaInfo.join('\n') : '*No saga information available*',
                inline: false
            });

            // Points & Statistics
            const pointsInfo = [];
            pointsInfo.push(`**Points:** ${dbUser.onboarding.punten || 0}`);
            pointsInfo.push(`**Penalty Points:** ${dbUser.onboarding.strafpunten || 0}`);
            pointsInfo.push(`**Strikes:** ${dbUser.onboarding.strikes || 0}`);

            embed.addFields({
                name: '📊 Points & Statistics',
                value: pointsInfo.join('\n'),
                inline: false
            });

            // Activity Statistics
            embed.addFields(
                {
                    name: '📅 Last 24 Hours',
                    value: `💬 **Messages:** ${stats1day.totalMessages}\n🎙️ **Voice Time:** ${formatTime(stats1day.totalVoiceTime)}`,
                    inline: true
                },
                {
                    name: '📅 Last 7 Days',
                    value: `💬 **Messages:** ${stats7days.totalMessages}\n🎙️ **Voice Time:** ${formatTime(stats7days.totalVoiceTime)}`,
                    inline: true
                },
                {
                    name: '📅 Last 14 Days',
                    value: `💬 **Messages:** ${stats14days.totalMessages}\n🎙️ **Voice Time:** ${formatTime(stats14days.totalVoiceTime)}`,
                    inline: true
                }
            );

            // Notes (if available)
            if (dbUser.onboarding.notes) {
                embed.addFields({
                    name: '📝 Notes',
                    value: dbUser.onboarding.notes.substring(0, 1024), // Discord field limit
                    inline: false
                });
            }

            // Footer
            embed.setFooter({
                text: `Requested by ${interaction.user.tag} • Registered on ${formatDate(dbUser.registeredAt)}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            });
            embed.setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            logger.info(`User stats viewed for ${targetUser.tag} in ${interaction.guild.name} by ${interaction.user.tag}`);

        } catch (error) {
            logger.error(`Error fetching user stats: ${error.message}`);
            logger.error(error.stack);

            const errorEmbed = createErrorEmbed(
                'An error occurred while fetching user information. Please try again later.'
            );

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
