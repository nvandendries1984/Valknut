import { SlashCommandBuilder, ChannelType, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';
import { Guild } from '../../models/Guild.js';
import { canExecuteCommand } from '../../utils/permissions.js';

export default {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('setbugchannel')
        .setDescription('Set the channel where bug reports will be sent')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel to send bug reports to')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .setDMPermission(false),

    async execute(interaction) {
        // Check permissions
        const permissionCheck = await canExecuteCommand(interaction);
        if (!permissionCheck.allowed) {
            return interaction.reply({
                embeds: [createErrorEmbed(permissionCheck.reason)],
                ephemeral: true
            });
        }

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

            // Save the bug channel
            const success = await Guild.setBugChannel(interaction.guild.id, channel.id);

            if (success) {
                const embed = createSuccessEmbed(
                    `Bug report channel has been set to ${channel}\n\nAll bug reports will now be sent to this channel.`
                );
                await interaction.editReply({ embeds: [embed] });

                // Send test message to the bug channel
                await channel.send({
                    embeds: [createSuccessEmbed('✅ Bug report channel configured successfully!')]
                });
            } else {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Failed to save bug channel configuration!')],
                });
            }
        } catch (error) {
            return interaction.editReply({
                embeds: [createErrorEmbed('An error occurred while saving the bug channel configuration!')]
            });
        }
    }
};
