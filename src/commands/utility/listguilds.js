import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Guild } from '../../models/Guild.js';
import { createEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';
import { config } from '../../config/config.js';

export default {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('listguilds')
        .setDescription('List all guilds the bot is in (Owner only)')
        .addBooleanOption(option =>
            option
                .setName('active')
                .setDescription('Show only active guilds')
                .setRequired(false)),

    async execute(interaction) {
        // Owner check
        if (interaction.user.id !== config.ownerId) {
            return interaction.reply({
                embeds: [createErrorEmbed('🚫 This command is only available to the bot owner.')],
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const showActiveOnly = interaction.options.getBoolean('active') ?? true;

            const filter = showActiveOnly ? { active: true } : {};
            const guilds = await Guild.find(filter).sort({ memberCount: -1 });

            if (guilds.length === 0) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('No guilds found!')]
                });
            }

            // Calculate total members
            const totalMembers = guilds.reduce((sum, g) => sum + g.memberCount, 0);

            const embed = createEmbed(`Guild List (${guilds.length})`)
                .setDescription(
                    `Total Members: **${totalMembers.toLocaleString()}**\n` +
                    `Showing: **${showActiveOnly ? 'Active' : 'All'}** guilds\n\n`
                );

            // Split guilds into chunks of 10 for field limits
            const chunks = [];
            for (let i = 0; i < guilds.length; i += 10) {
                chunks.push(guilds.slice(i, i + 10));
            }

            // Add first chunk to main embed
            const firstChunk = chunks[0];
            for (const guild of firstChunk) {
                const status = guild.active ? '✅' : '❌';
                const logChannel = guild.logChannelId ? '📢' : '⚠️';

                embed.addFields({
                    name: `${status} ${guild.guildName}`,
                    value:
                        `ID: \`${guild.guildId}\`\n` +
                        `Members: **${guild.memberCount}**\n` +
                        `${logChannel} Log: ${guild.logChannelId ? 'Configured' : 'Not set'}\n` +
                        `Joined: <t:${Math.floor(guild.joinedAt.getTime() / 1000)}:R>`,
                    inline: true
                });
            }

            await interaction.editReply({ embeds: [embed] });

            // Send additional embeds if there are more guilds
            for (let i = 1; i < chunks.length; i++) {
                const additionalEmbed = createEmbed(`Guild List (continued ${i + 1})`);

                for (const guild of chunks[i]) {
                    const status = guild.active ? '✅' : '❌';
                    const logChannel = guild.logChannelId ? '📢' : '⚠️';

                    additionalEmbed.addFields({
                        name: `${status} ${guild.guildName}`,
                        value:
                            `ID: \`${guild.guildId}\`\n` +
                            `Members: **${guild.memberCount}**\n` +
                            `${logChannel} Log: ${guild.logChannelId ? 'Configured' : 'Not set'}\n` +
                            `Joined: <t:${Math.floor(guild.joinedAt.getTime() / 1000)}:R>`,
                        inline: true
                    });
                }

                await interaction.followUp({ embeds: [additionalEmbed], ephemeral: true });
            }

        } catch (error) {
            return interaction.editReply({
                embeds: [createErrorEmbed('An error occurred while fetching guilds!')]
            });
        }
    }
};
