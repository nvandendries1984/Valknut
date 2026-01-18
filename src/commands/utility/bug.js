import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed, createEmbed } from '../../utils/embedBuilder.js';
import { Guild } from '../../models/Guild.js';
import { logger } from '../../utils/logger.js';
import { canExecuteCommand } from '../../utils/permissions.js';

export default {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('bug')
        .setDescription('Report a bug to the moderators')
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

        // Create modal
        const modal = new ModalBuilder()
            .setCustomId('bugModal')
            .setTitle('Report a Bug');

        // Create text input for bug title
        const titleInput = new TextInputBuilder()
            .setCustomId('bugTitle')
            .setLabel('Bug Title')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Brief summary of the bug')
            .setRequired(true)
            .setMaxLength(100);

        // Create text input for steps to reproduce
        const stepsInput = new TextInputBuilder()
            .setCustomId('bugSteps')
            .setLabel('Steps to Reproduce')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('1. Go to...\n2. Click on...\n3. See error')
            .setRequired(true)
            .setMaxLength(500);

        // Create text input for expected behavior
        const expectedInput = new TextInputBuilder()
            .setCustomId('bugExpected')
            .setLabel('Expected Behavior')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('What did you expect to happen?')
            .setRequired(true)
            .setMaxLength(500);

        // Create text input for actual behavior
        const actualInput = new TextInputBuilder()
            .setCustomId('bugActual')
            .setLabel('Actual Behavior')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('What actually happened?')
            .setRequired(true)
            .setMaxLength(500);

        // Create text input for additional info
        const additionalInput = new TextInputBuilder()
            .setCustomId('bugAdditional')
            .setLabel('Additional Information (Optional)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Screenshots, error messages, etc.')
            .setRequired(false)
            .setMaxLength(500);

        // Add inputs to action rows
        const titleRow = new ActionRowBuilder().addComponents(titleInput);
        const stepsRow = new ActionRowBuilder().addComponents(stepsInput);
        const expectedRow = new ActionRowBuilder().addComponents(expectedInput);
        const actualRow = new ActionRowBuilder().addComponents(actualInput);
        const additionalRow = new ActionRowBuilder().addComponents(additionalInput);

        // Add rows to modal
        modal.addComponents(titleRow, stepsRow, expectedRow, actualRow, additionalRow);

        // Show modal to user
        await interaction.showModal(modal);
    },

    async handleModalSubmit(interaction) {
        try {
            // Get form data
            const title = interaction.fields.getTextInputValue('bugTitle');
            const steps = interaction.fields.getTextInputValue('bugSteps');
            const expected = interaction.fields.getTextInputValue('bugExpected');
            const actual = interaction.fields.getTextInputValue('bugActual');
            const additional = interaction.fields.getTextInputValue('bugAdditional') || 'None';

            // Defer reply
            await interaction.deferReply({ ephemeral: true });

            // Get bug channel from database
            const bugChannelId = await Guild.getBugChannel(interaction.guild.id);

            if (!bugChannelId) {
                logger.error(`No bug channel configured for guild ${interaction.guild.id}`);
                return interaction.editReply({
                    embeds: [createErrorEmbed('Bug report channel is not configured. Please ask a moderator to use `/setbugchannel` first.')]
                });
            }

            // Get bug channel
            let bugChannel;
            try {
                bugChannel = await interaction.guild.channels.fetch(bugChannelId);
            } catch (error) {
                logger.error(`Failed to fetch bug channel: ${error.message}`);
                return interaction.editReply({
                    embeds: [createErrorEmbed('Could not find the bug report channel. Please contact a moderator.')]
                });
            }

            // Create bug report embed
            const bugEmbed = createEmbed()
                .setTitle('🐛 New Bug Report')
                .setColor('#FF0000')
                .addFields(
                    { name: 'Title', value: title, inline: false },
                    { name: 'Reported By', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
                    { name: 'Steps to Reproduce', value: steps, inline: false },
                    { name: 'Expected Behavior', value: expected, inline: false },
                    { name: 'Actual Behavior', value: actual, inline: false },
                    { name: 'Additional Information', value: additional, inline: false }
                )
                .setTimestamp();

            // Send bug report to channel
            try {
                await bugChannel.send({ embeds: [bugEmbed] });
                logger.info(`Bug report sent to channel from ${interaction.user.tag}: ${title}`);

                // Confirm to user
                return interaction.editReply({
                    embeds: [createSuccessEmbed('Your bug report has been submitted successfully! The moderators will review it.')]
                });
            } catch (error) {
                logger.error(`Failed to send bug report to channel: ${error.message}`);
                return interaction.editReply({
                    embeds: [createErrorEmbed('Failed to send bug report. The bot may not have permission to post in the bug channel.')]
                });
            }
        } catch (error) {
            logger.error(`Error handling bug modal: ${error.message}`);

            const errorResponse = {
                embeds: [createErrorEmbed('An error occurred while processing your bug report. Please try again later.')]
            };

            if (interaction.deferred) {
                return interaction.editReply(errorResponse);
            } else {
                return interaction.reply({ ...errorResponse, ephemeral: true });
            }
        }
    }
};
