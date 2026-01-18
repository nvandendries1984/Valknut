import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { canExecuteCommand } from '../../utils/permissions.js';
import { createErrorEmbed, createSuccessEmbed } from '../../utils/embedBuilder.js';
import { User } from '../../models/User.js';
import { logger } from '../../utils/logger.js';

export default {
    category: 'moderation',
    data: new SlashCommandBuilder()
        .setName('setpoints')
        .setDescription('Set Points & Statistics for a user via interactive modal (moderator only)')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to set points for')
                .setRequired(true)
        )
        .setDMPermission(false),

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
        const guildId = interaction.guild.id;

        // Check if target user is registered
        const dbUser = await User.findByUserId(targetUser.id, guildId);
        if (!dbUser) {
            return interaction.reply({
                embeds: [createErrorEmbed(`User ${targetUser} is not registered! Use \`/register\` first.`)],
                ephemeral: true
            });
        }

        // Don't allow for bot users
        if (targetUser.bot) {
            return interaction.reply({
                embeds: [createErrorEmbed('Cannot set points for bot users!')],
                ephemeral: true
            });
        }

        // Create modal with current values pre-filled
        const modal = new ModalBuilder()
            .setCustomId(`setpoints_${targetUser.id}`)
            .setTitle(`Points & Statistics - ${targetUser.username}`);

        // Points input
        const pointsInput = new TextInputBuilder()
            .setCustomId('punten')
            .setLabel('Points')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter points (number)')
            .setValue(String(dbUser.onboarding?.punten || 0))
            .setRequired(false);

        // Penalty Points input
        const penaltyInput = new TextInputBuilder()
            .setCustomId('strafpunten')
            .setLabel('Penalty Points')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter penalty points (number)')
            .setValue(String(dbUser.onboarding?.strafpunten || 0))
            .setRequired(false);

        // Strikes input
        const strikesInput = new TextInputBuilder()
            .setCustomId('strikes')
            .setLabel('Strikes')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter strikes (number)')
            .setValue(String(dbUser.onboarding?.strikes || 0))
            .setRequired(false);

        // Notes input
        const notesInput = new TextInputBuilder()
            .setCustomId('notes')
            .setLabel('Notes')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Enter notes (optional)')
            .setValue(dbUser.onboarding?.notes || '')
            .setRequired(false);

        // Add inputs to action rows
        const firstActionRow = new ActionRowBuilder().addComponents(pointsInput);
        const secondActionRow = new ActionRowBuilder().addComponents(penaltyInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(strikesInput);
        const fourthActionRow = new ActionRowBuilder().addComponents(notesInput);

        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);

        // Show modal
        await interaction.showModal(modal);

        // Wait for modal submission
        try {
            const modalSubmit = await interaction.awaitModalSubmit({
                filter: (i) => i.customId === `setpoints_${targetUser.id}` && i.user.id === interaction.user.id,
                time: 300000 // 5 minutes
            });

            // Get values from modal
            const punten = parseInt(modalSubmit.fields.getTextInputValue('punten')) || 0;
            const strafpunten = parseInt(modalSubmit.fields.getTextInputValue('strafpunten')) || 0;
            const strikes = parseInt(modalSubmit.fields.getTextInputValue('strikes')) || 0;
            const notes = modalSubmit.fields.getTextInputValue('notes') || '';

            // Validate numbers
            if (isNaN(punten) || isNaN(strafpunten) || isNaN(strikes)) {
                return modalSubmit.reply({
                    embeds: [createErrorEmbed('Invalid input! Points, Penalty Points, and Strikes must be numbers.')],
                    ephemeral: true
                });
            }

            // Update user in database
            if (!dbUser.onboarding) {
                dbUser.onboarding = {};
            }

            dbUser.onboarding.punten = punten;
            dbUser.onboarding.strafpunten = strafpunten;
            dbUser.onboarding.strikes = strikes;
            dbUser.onboarding.notes = notes;

            await dbUser.save();

            logger.info(`Points updated for user ${targetUser.username} (${targetUser.id}) by ${interaction.user.username}: Points=${punten}, Penalty=${strafpunten}, Strikes=${strikes}`);

            // Send success message
            await modalSubmit.reply({
                embeds: [createSuccessEmbed(
                    `✅ **Points & Statistics updated for ${targetUser}**\n\n` +
                    `📊 **Points:** ${punten}\n` +
                    `⚠️ **Penalty Points:** ${strafpunten}\n` +
                    `⚡ **Strikes:** ${strikes}\n` +
                    `📝 **Notes:** ${notes || 'None'}`
                )],
                ephemeral: true
            });

        } catch (error) {
            if (error.message.includes('time')) {
                // Modal timed out
                logger.warn(`Modal timed out for user ${interaction.user.username}`);
            } else {
                logger.error(`Error handling setpoints modal: ${error.message}`);
            }
        }
    }
};
