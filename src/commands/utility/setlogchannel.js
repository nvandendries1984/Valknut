import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';
import { Guild } from '../../models/Guild.js';

export default {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('setlogchannel')
        .setDescription('Set the channel where bot logs will be sent')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel to send logs to')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        // Check if bot has permission to send messages in the channel
        const permissions = channel.permissionsFor(interaction.guild.members.me);
        if (!permissions.has(PermissionFlagsBits.SendMessages)) {
            return interaction.reply({
                embeds: [createErrorEmbed('I don\'t have permission to send messages in that channel!')],
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply();

        try {
            // Ensure guild exists in database
            let guild = await Guild.findByGuildId(interaction.guild.id);

            if (!guild) {
                // Register guild if it doesn't exist
                guild = await Guild.registerGuild(interaction.guild);
            }

            // Save the log channel
            const success = await Guild.setLogChannel(interaction.guild.id, channel.id);

            if (success) {
                const embed = createSuccessEmbed(
                    `Log channel has been set to ${channel}\n\nAll bot logs will now be sent to this channel.`
                );
                await interaction.editReply({ embeds: [embed] });

                // Send test message to the log channel
                await channel.send({
                    embeds: [createSuccessEmbed('✅ Log channel configured successfully!')]
                });
            } else {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Failed to save log channel configuration!')],
                });
            }
        } catch (error) {
            return interaction.editReply({
                embeds: [createErrorEmbed('An error occurred while saving the log channel configuration!')]
            });
        }
    }
};
