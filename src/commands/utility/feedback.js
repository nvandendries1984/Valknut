import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { config } from '../../config/config.js';
import { createSuccessEmbed, createErrorEmbed, createEmbed } from '../../utils/embedBuilder.js';
import { logger } from '../../utils/logger.js';

export default {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('feedback')
        .setDescription('Submit feedback to the bot owner'),
    
    async execute(interaction) {
        // Create modal
        const modal = new ModalBuilder()
            .setCustomId('feedbackModal')
            .setTitle('Submit Feedback');

        // Create text input for name
        const nameInput = new TextInputBuilder()
            .setCustomId('feedbackName')
            .setLabel('Name')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Your name')
            .setRequired(true)
            .setMaxLength(100);

        // Create text input for email
        const emailInput = new TextInputBuilder()
            .setCustomId('feedbackEmail')
            .setLabel('E-mail')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('your.email@example.com')
            .setRequired(true)
            .setMaxLength(100);

        // Create text input for subject
        const subjectInput = new TextInputBuilder()
            .setCustomId('feedbackSubject')
            .setLabel('Subject')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Brief summary of your feedback')
            .setRequired(true)
            .setMaxLength(100);

        // Create text input for message
        const messageInput = new TextInputBuilder()
            .setCustomId('feedbackMessage')
            .setLabel('Message')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Describe your feedback in detail...')
            .setRequired(true)
            .setMaxLength(1000);

        // Add inputs to action rows (max 5 action rows per modal)
        const nameRow = new ActionRowBuilder().addComponents(nameInput);
        const emailRow = new ActionRowBuilder().addComponents(emailInput);
        const subjectRow = new ActionRowBuilder().addComponents(subjectInput);
        const messageRow = new ActionRowBuilder().addComponents(messageInput);

        // Add rows to modal
        modal.addComponents(nameRow, emailRow, subjectRow, messageRow);

        // Show modal to user
        await interaction.showModal(modal);
    },

    async handleModalSubmit(interaction) {
        try {
            // Get form data
            const name = interaction.fields.getTextInputValue('feedbackName');
            const email = interaction.fields.getTextInputValue('feedbackEmail');
            const subject = interaction.fields.getTextInputValue('feedbackSubject');
            const message = interaction.fields.getTextInputValue('feedbackMessage');

            // Defer reply
            await interaction.deferReply({ ephemeral: true });

            // Validate owner ID
            if (!config.ownerId) {
                logger.error('OWNER_ID not configured in .env');
                return interaction.editReply({
                    embeds: [createErrorEmbed('Feedback system is not configured. Please contact an administrator.')]
                });
            }

            // Get bot owner
            let owner;
            try {
                owner = await interaction.client.users.fetch(config.ownerId);
            } catch (error) {
                logger.error(`Failed to fetch bot owner: ${error.message}`);
                return interaction.editReply({
                    embeds: [createErrorEmbed('Could not reach the bot owner. Please try again later.')]
                });
            }

            // Create feedback embed
            const feedbackEmbed = createEmbed()
                .setTitle('📬 New Feedback Received')
                .setColor('#5865F2')
                .addFields(
                    { name: 'Name', value: name, inline: true },
                    { name: 'E-mail', value: email, inline: true },
                    { name: 'Discord User', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
                    { name: 'Server', value: interaction.guild ? `${interaction.guild.name} (${interaction.guild.id})` : 'Direct Message', inline: false },
                    { name: 'Subject', value: subject, inline: false },
                    { name: 'Message', value: message, inline: false }
                )
                .setTimestamp();

            // Send DM to owner
            try {
                await owner.send({ embeds: [feedbackEmbed] });
                logger.info(`Feedback sent to owner from ${interaction.user.tag}: ${subject}`);
                
                // Confirm to user
                return interaction.editReply({
                    embeds: [createSuccessEmbed('Your feedback has been sent successfully! Thank you for your input.')]
                });
            } catch (error) {
                logger.error(`Failed to send feedback DM to owner: ${error.message}`);
                return interaction.editReply({
                    embeds: [createErrorEmbed('Failed to send feedback. The bot owner may have DMs disabled.')]
                });
            }
        } catch (error) {
            logger.error(`Error handling feedback modal: ${error.message}`);
            
            const errorResponse = {
                embeds: [createErrorEmbed('An error occurred while processing your feedback. Please try again later.')]
            };

            if (interaction.deferred) {
                return interaction.editReply(errorResponse);
            } else {
                return interaction.reply({ ...errorResponse, ephemeral: true });
            }
        }
    }
};
