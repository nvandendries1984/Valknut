import { SlashCommandBuilder } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';
import { Guild } from '../../models/Guild.js';
import { logger } from '../../utils/logger.js';

export default {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('setmod')
        .setDescription('Set the moderator role for this server (Server Owner only)')
        .addRoleOption(option =>
            option
                .setName('role')
                .setDescription('The moderator role')
                .setRequired(true)
        )
        .setDMPermission(false),

    async execute(interaction) {
        // Check if command is used in a guild
        if (!interaction.guild) {
            return interaction.reply({
                embeds: [createErrorEmbed('This command can only be used in a server!')],
                ephemeral: true
            });
        }

        // Only server owner can set mod role
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({
                embeds: [createErrorEmbed('Only the server owner can use this command!')],
                ephemeral: true
            });
        }

        const role = interaction.options.getRole('role');
        const guildId = interaction.guild.id;

        try {
            // Find or create guild in database
            let guild = await Guild.findByGuildId(guildId);

            if (!guild) {
                // Create guild if it doesn't exist
                guild = new Guild({
                    guildId: interaction.guild.id,
                    guildName: interaction.guild.name,
                    ownerId: interaction.guild.ownerId,
                    memberCount: interaction.guild.memberCount,
                    icon: interaction.guild.icon
                });
            }

            // Update moderator role
            guild.settings.modRoleId = role.id;
            await guild.save();

            logger.info(`Moderator role set to ${role.name} (${role.id}) in guild ${interaction.guild.name}`);

            await interaction.reply({
                embeds: [createSuccessEmbed(
                    `✅ Moderator role has been set!\n\n` +
                    `**Role:** ${role}\n` +
                    `**Role ID:** \`${role.id}\``
                )],
                ephemeral: true
            });

        } catch (error) {
            logger.error(`Failed to set moderator role: ${error.message}`);
            await interaction.reply({
                embeds: [createErrorEmbed('Failed to set moderator role. Please try again.')],
                ephemeral: true
            });
        }
    }
};
