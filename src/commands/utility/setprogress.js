import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } from 'discord.js';
import { User } from '../../models/User.js';
import { createSuccessEmbed, createErrorEmbed } from '../../utils/embedBuilder.js';
import { logger } from '../../utils/logger.js';

export default {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('setprogress')
        .setDescription('Set Saga & Progress information for a member')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The member to set progress for')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('member');

            // Check if user exists in database
            const dbUser = await User.findOne({
                userId: targetUser.id,
                guildId: interaction.guild.id
            });

            if (!dbUser) {
                return interaction.reply({
                    embeds: [createErrorEmbed('User not found in database. They need to be registered first with `/register`.')],
                    ephemeral: true
                });
            }

            // Create modal
            const modal = new ModalBuilder()
                .setCustomId(`setprogress_${targetUser.id}`)
                .setTitle(`Set Progress for ${targetUser.username}`);

            // Saga dropdown - Note: Discord modals don't support dropdowns, so we use text input
            // User will need to type one of: Beardserker, Sideburn Soldier, Moustache Militia, Goatee Gladiator, Whaler, Shieldmaiden
            const sagaInput = new TextInputBuilder()
                .setCustomId('saga')
                .setLabel('Saga')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Beardserker, Sideburn Soldier, etc.')
                .setValue(dbUser.onboarding.saga || '')
                .setRequired(false);

            const sagaLevelInput = new TextInputBuilder()
                .setCustomId('sagaLevel')
                .setLabel('Saga Level (number)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('0')
                .setValue(dbUser.onboarding.sagaLevel?.toString() || '')
                .setRequired(false);

            const datumRecruitInput = new TextInputBuilder()
                .setCustomId('datumRecruit')
                .setLabel('Recruit Date (YYYY-MM-DD)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('2025-01-18')
                .setValue(dbUser.onboarding.datumRecruit ? new Date(dbUser.onboarding.datumRecruit).toISOString().split('T')[0] : '')
                .setRequired(false);

            const datumWarriorInput = new TextInputBuilder()
                .setCustomId('datumWarrior')
                .setLabel('Warrior Date (YYYY-MM-DD)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('2025-12-31')
                .setValue(dbUser.onboarding.datumWarrior ? new Date(dbUser.onboarding.datumWarrior).toISOString().split('T')[0] : '')
                .setRequired(false);

            // Add inputs to action rows
            const sagaRow = new ActionRowBuilder().addComponents(sagaInput);
            const sagaLevelRow = new ActionRowBuilder().addComponents(sagaLevelInput);
            const datumRecruitRow = new ActionRowBuilder().addComponents(datumRecruitInput);
            const datumWarriorRow = new ActionRowBuilder().addComponents(datumWarriorInput);

            modal.addComponents(sagaRow, sagaLevelRow, datumRecruitRow, datumWarriorRow);

            await interaction.showModal(modal);

        } catch (error) {
            logger.error('Error in setprogress command:', error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    embeds: [createErrorEmbed('An error occurred while creating the progress form.')],
                    ephemeral: true
                });
            }
        }
    },

    // Handle modal submission
    async handleModalSubmit(interaction) {
        try {
            const userId = interaction.customId.split('_')[1];

            // Get form values
            const saga = interaction.fields.getTextInputValue('saga').trim() || null;
            const sagaLevelStr = interaction.fields.getTextInputValue('sagaLevel').trim();
            const datumRecruitStr = interaction.fields.getTextInputValue('datumRecruit').trim();
            const datumWarriorStr = interaction.fields.getTextInputValue('datumWarrior').trim();

            // Validate saga if provided
            const validSagas = ['Beardserker', 'Sideburn Soldier', 'Moustache Militia', 'Goatee Gladiator', 'Whaler', 'Shieldmaiden'];
            if (saga && !validSagas.includes(saga)) {
                return interaction.reply({
                    embeds: [createErrorEmbed(`Invalid saga. Must be one of: ${validSagas.join(', ')}`)],
                    ephemeral: true
                });
            }

            // Parse saga level
            const sagaLevel = sagaLevelStr ? parseInt(sagaLevelStr) : null;
            if (sagaLevelStr && (isNaN(sagaLevel) || sagaLevel < 0)) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Saga Level must be a valid number (0 or higher).')],
                    ephemeral: true
                });
            }

            // Parse dates
            let datumRecruit = null;
            if (datumRecruitStr) {
                datumRecruit = new Date(datumRecruitStr);
                if (isNaN(datumRecruit.getTime())) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('Recruit Date must be in format YYYY-MM-DD.')],
                        ephemeral: true
                    });
                }
            }

            let datumWarrior = null;
            if (datumWarriorStr) {
                datumWarrior = new Date(datumWarriorStr);
                if (isNaN(datumWarrior.getTime())) {
                    return interaction.reply({
                        embeds: [createErrorEmbed('Warrior Date must be in format YYYY-MM-DD.')],
                        ephemeral: true
                    });
                }
            }

            // Update user in database
            const updatedUser = await User.findOneAndUpdate(
                {
                    userId: userId,
                    guildId: interaction.guild.id
                },
                {
                    $set: {
                        'onboarding.saga': saga,
                        'onboarding.sagaLevel': sagaLevel,
                        'onboarding.datumRecruit': datumRecruit,
                        'onboarding.datumWarrior': datumWarrior
                    }
                },
                { new: true }
            );

            if (!updatedUser) {
                return interaction.reply({
                    embeds: [createErrorEmbed('User not found in database.')],
                    ephemeral: true
                });
            }

            // Get the target user for the success message
            const targetUser = await interaction.client.users.fetch(userId);

            // Create success embed
            const successEmbed = createSuccessEmbed(
                `✅ Progress updated for **${targetUser.username}**`
            );

            // Add fields to show what was updated
            if (saga) successEmbed.addFields({ name: 'Saga', value: saga, inline: true });
            if (sagaLevel !== null) successEmbed.addFields({ name: 'Saga Level', value: sagaLevel.toString(), inline: true });
            if (datumRecruit) successEmbed.addFields({ name: 'Recruit Date', value: datumRecruit.toISOString().split('T')[0], inline: true });
            if (datumWarrior) successEmbed.addFields({ name: 'Warrior Date', value: datumWarrior.toISOString().split('T')[0], inline: true });

            await interaction.reply({
                embeds: [successEmbed],
                ephemeral: false
            });

            logger.info(`Progress updated for user ${targetUser.username} (${userId}) in guild ${interaction.guild.name}`);

        } catch (error) {
            logger.error('Error handling setprogress modal submission:', error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    embeds: [createErrorEmbed('An error occurred while saving the progress.')],
                    ephemeral: true
                });
            }
        }
    }
};
