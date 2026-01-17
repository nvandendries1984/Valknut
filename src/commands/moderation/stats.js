import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { UserStats } from '../../models/UserStats.js';
import { canExecuteCommand } from '../../utils/permissions.js';
import { createEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';
import { logger } from '../../utils/logger.js';

export default {
    category: 'moderation',
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View statistics for a user (moderator only)')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to view statistics for')
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
                embeds: [createErrorEmbed('Cannot view statistics for bot users!')],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            // Fetch stats for all three periods
            const [stats1day, stats7days, stats14days] = await Promise.all([
                UserStats.getStatsForPeriod(targetUser.id, interaction.guild.id, 1),
                UserStats.getStatsForPeriod(targetUser.id, interaction.guild.id, 7),
                UserStats.getStatsForPeriod(targetUser.id, interaction.guild.id, 14)
            ]);

            // Format voice time
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

            // Create embed
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`📊 User Statistics`)
                .setDescription(`Statistics for ${targetUser}`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
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
                )
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();

            // Add daily breakdown for last 7 days
            if (stats7days.dailyStats.length > 0) {
                // Sort by date (newest first)
                const sortedStats = stats7days.dailyStats.sort((a, b) =>
                    new Date(b.date) - new Date(a.date)
                );

                // Show top 5 most recent days with activity
                const activeDays = sortedStats
                    .filter(day => day.messageCount > 0 || day.voiceTime > 0)
                    .slice(0, 5);

                if (activeDays.length > 0) {
                    const breakdown = activeDays.map(day => {
                        const date = new Date(day.date);
                        const dateStr = date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                        });
                        return `**${dateStr}:** ${day.messageCount} msgs, ${formatTime(day.voiceTime)} voice`;
                    }).join('\n');

                    embed.addFields({
                        name: '📋 Recent Activity',
                        value: breakdown,
                        inline: false
                    });
                }
            }

            await interaction.editReply({ embeds: [embed] });

            logger.info(`Stats viewed for ${targetUser.tag} in ${interaction.guild.name} by ${interaction.user.tag}`);

        } catch (error) {
            logger.error(`Error fetching stats: ${error.message}`);

            const errorEmbed = createErrorEmbed(
                'An error occurred while fetching statistics. Please try again later.'
            );

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
